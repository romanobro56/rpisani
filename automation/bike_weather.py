"""Private configuration, public code. Uses only the Python standard library."""

import json
import math
import os
import sys
import time
from dataclasses import dataclass
from datetime import datetime, time as daytime, timedelta
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

ZONE = ZoneInfo("America/New_York")
FIELDS = ("precipitation_probability", "precipitation", "snowfall", "weather_code")


class ReminderError(Exception):
    """Messages must be safe for public CI logs."""


@dataclass(frozen=True)
class Hour:
    end: int
    probability: float
    precipitation: float
    snowfall: float
    code: int


def required(name):
    value = os.environ.get(name, "").strip()
    if not value:
        raise ReminderError(f"Missing secret: {name}")
    return value


def request_json(request, service, idempotent=False):
    for attempt in range(3):
        try:
            with urlopen(request, timeout=7) as response:
                return json.load(response)
        except HTTPError as error:
            # Never print response bodies, URLs, headers, or recipient details.
            concurrent = False
            if idempotent and error.code == 409:
                try:
                    name = json.load(error).get("name")
                except (ValueError, AttributeError, UnicodeError):
                    name = None
                if name == "invalid_idempotent_request":
                    return {"already_processed": True}
                concurrent = name == "concurrent_idempotent_requests"
            if (not concurrent and error.code not in (429, 500, 502, 503, 504)) or attempt == 2:
                raise ReminderError(f"{service} request failed (HTTP {error.code}).") from None
        except (URLError, TimeoutError, OSError):
            if attempt == 2:
                raise ReminderError(f"{service} unavailable after three attempts.") from None
        except (ValueError, UnicodeError):
            raise ReminderError(f"{service} returned invalid JSON.") from None
        time.sleep(2 ** (attempt + 1))


def day_bounds(target):
    start = datetime.combine(target, daytime.min, ZONE)
    end = datetime.combine(target + timedelta(days=1), daytime.min, ZONE)
    return int(start.timestamp()), int(end.timestamp())


def parse_forecast(data, target):
    try:
        hourly = data["hourly"]
        stamps = hourly["time"]
        if any(len(hourly[field]) != len(stamps) for field in FIELDS):
            raise ValueError
        start, end = day_bounds(target)
        hours = []
        for i, stamp in enumerate(stamps):
            if type(stamp) is not int:
                raise ValueError
            # Amounts/probabilities describe the PRECEDING hour. Include the
            # following midnight so tomorrow's final hour is not lost.
            if start < stamp <= end:
                values = [hourly[field][i] for field in FIELDS]
                if any(type(v) not in (int, float) or not math.isfinite(v) for v in values):
                    raise ValueError
                chance, amount, snow, code = values
                if not 0 <= chance <= 100 or min(amount, snow, code) < 0:
                    raise ValueError
                hours.append(Hour(stamp, chance, amount, snow, int(code)))
        expected = list(range(start + 3600, end + 1, 3600))
        if [hour.end for hour in hours] != expected:
            raise ValueError
        return hours
    except (KeyError, TypeError, ValueError, OverflowError):
        raise ReminderError("Forecast is incomplete or invalid; cannot classify tomorrow as dry.") from None


def fetch_forecast(target):
    latitude, longitude = required("WEATHER_LATITUDE"), required("WEATHER_LONGITUDE")
    try:
        if not -90 <= float(latitude) <= 90 or not -180 <= float(longitude) <= 180:
            raise ValueError
    except ValueError:
        raise ReminderError("Invalid weather coordinate secrets.") from None
    params = urlencode({
        "latitude": latitude, "longitude": longitude,
        "hourly": ",".join(FIELDS), "timezone": ZONE.key,
        "timeformat": "unixtime", "precipitation_unit": "mm",
        "start_date": target.isoformat(),
        "end_date": (target + timedelta(days=1)).isoformat(),
    })
    request = Request("https://api.open-meteo.com/v1/forecast?" + params,
                      headers={"User-Agent": "BikeWeatherReminder/1.0"})
    return parse_forecast(request_json(request, "Weather service"), target)


def needs_reminder(hours):
    return any(h.probability >= 60 for h in hours) or sum(h.probability >= 40 for h in hours) >= 3


def precipitation_kind(hours):
    kinds = set()
    for h in hours:
        if h.probability < 40:
            continue
        if h.code in (56, 57, 66, 67, 96, 99):
            kinds.add("ice/hail")
        if h.snowfall > 0 or h.code in (71, 73, 75, 77, 85, 86):
            kinds.add("snow")
        if h.code in (51, 53, 55, 61, 63, 65, 80, 81, 82, 95) or h.precipitation > 0 and h.snowfall == 0:
            kinds.add("rain")
    return "/".join(sorted(kinds)) or "precipitation"


def compose_email(hours, target, test=False):
    alert = needs_reminder(hours)
    kind = precipitation_kind(hours)
    subject = f"Bring your bike inside — {kind} tomorrow"
    if test:
        subject = "[TEST] Bike weather reminder"
    lines = [f"Forecast for {os.environ.get('WEATHER_LOCATION', 'your area')}",
             f"Tomorrow: {target:%A, %B %d, %Y}", ""]
    if test:
        lines += ["This is the one-time delivery test, sent regardless of the forecast.", ""]
    lines += ["Bring your bike inside before tomorrow." if alert else
              "Tomorrow does not meet your alert threshold; a normal daily run would stay silent.",
              f"Peak hourly precipitation chance: {max(h.probability for h in hours):.0f}%",
              f"Forecast total precipitation (including melted snow): {sum(h.precipitation for h in hours):.1f} mm",
              f"Forecast snowfall: {sum(h.snowfall for h in hours):.1f} cm", ""]
    wet = [h for h in hours if h.probability >= 40]
    if wet:
        lines.append("Hours with at least a 40% chance (Eastern time):")
        for h in wet:
            start = datetime.fromtimestamp(h.end - 3600, ZONE)
            end = datetime.fromtimestamp(h.end, ZONE)
            lines.append(f"• {start:%I:%M %p %Z}–{end:%I:%M %p %Z}: {h.probability:.0f}%, {h.precipitation:.1f} mm")
    lines += ["", "Alert rule: any hour ≥60%, or at least three hours ≥40%.",
              "Rain, snow, and ice count. Forecasts are uncertain and can change.",
              "Forecast data: Open-Meteo (https://open-meteo.com/)"]
    return subject, "\n".join(lines)


def send_email(subject, body, target, test=False):
    payload = json.dumps({
        "from": os.environ.get("BIKE_EMAIL_FROM") or "Bike reminder <onboarding@resend.dev>",
        "to": [required("BIKE_EMAIL_TO")], "subject": subject, "text": body,
    }).encode()
    key = f"bike-weather/{'test' if test else 'daily'}/{target.isoformat()}"
    request = Request("https://api.resend.com/emails", data=payload, headers={
        "Authorization": "Bearer " + required("RESEND_API_KEY"),
        "Content-Type": "application/json", "Idempotency-Key": key,
        "User-Agent": "BikeWeatherReminder/1.0",
    })
    result = request_json(request, "Email service", idempotent=True)
    if isinstance(result, dict) and result.get("already_processed"):
        print("Daily send key already processed; no second email requested.")
        return "already-processed"
    if not isinstance(result, dict) or not result.get("id"):
        raise ReminderError("Email service did not confirm acceptance.")
    print("Test email accepted by provider." if test else "Reminder accepted by provider.")
    return "test-accepted" if test else "reminder-accepted"


def run(mode="dry-run", now=None):
    if mode not in ("dry-run", "test", "scheduled"):
        raise ReminderError("Invalid reminder mode.")
    now = now or datetime.now(ZONE)
    # Vercel cron is UTC. Two daily schedules cover EST and EDT; only the
    # schedule that lands in the local noon hour does work.
    if mode == "scheduled" and now.hour != 12:
        return "outside-noon-window"
    if mode != "dry-run":
        required("RESEND_API_KEY")
        required("BIKE_EMAIL_TO")
    target = now.date() + timedelta(days=1)
    hours = fetch_forecast(target)
    alert = needs_reminder(hours)
    print("Forecast validated. Alert threshold met." if alert else
          "Forecast validated. Below alert threshold.")
    if mode == "dry-run":
        print("Dry run complete; no email sent.")
        return "dry-run-alert" if alert else "dry-run-quiet"
    elif alert or mode == "test":
        subject, body = compose_email(hours, target, mode == "test")
        return send_email(subject, body, target, mode == "test")
    return "quiet"


def main():
    return run(os.environ.get("REMINDER_MODE", "dry-run"))


if __name__ == "__main__":
    try:
        main()
    except ReminderError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        sys.exit(1)
    except Exception:
        print("ERROR: Unexpected reminder failure; private details suppressed.", file=sys.stderr)
        sys.exit(1)
