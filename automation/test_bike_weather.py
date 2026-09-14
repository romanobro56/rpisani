import io
import json
import os
import unittest
from contextlib import redirect_stdout
from datetime import date, datetime
from unittest.mock import patch
from urllib.error import HTTPError

import bike_weather as bike


def forecast(target, chance=0, code=0):
    start, end = bike.day_bounds(target)
    stamps = list(range(start, end + 3601, 3600))
    return {"hourly": {"time": stamps,
                       "precipitation_probability": [chance] * len(stamps),
                       "precipitation": [0.0] * len(stamps),
                       "snowfall": [0.0] * len(stamps),
                       "weather_code": [code] * len(stamps)}}


class ReminderTests(unittest.TestCase):
    target = date(2026, 9, 15)

    def setUp(self):
        self.wet_hours = self.hours([60])
        self.dry_hours = self.hours([10])

    def hours(self, probabilities):
        data = forecast(self.target)
        for index, chance in enumerate(probabilities, 1):
            data["hourly"]["precipitation_probability"][index] = chance
        return bike.parse_forecast(data, self.target)

    def test_threshold_boundaries(self):
        for probabilities, expected in [([10], False), ([59], False), ([60], True),
                                        ([40, 40], False), ([40, 40, 40], True),
                                        ([39] * 24, False), ([0] * 24, False),
                                        ([40, 0, 40, 0, 40], True)]:
            with self.subTest(probabilities=probabilities):
                self.assertEqual(bike.needs_reminder(self.hours(probabilities)), expected)

    def test_day_lengths_across_dst_and_year_end(self):
        for target, count in [(date(2026, 3, 8), 23), (date(2026, 11, 1), 25),
                              (date(2026, 12, 31), 24)]:
            with self.subTest(target=target):
                self.assertEqual(len(bike.parse_forecast(forecast(target), target)), count)

    def test_midnight_belongs_to_preceding_hour(self):
        data = forecast(self.target)
        data["hourly"]["precipitation_probability"][0] = 100
        self.assertFalse(bike.needs_reminder(bike.parse_forecast(data, self.target)))
        data["hourly"]["precipitation_probability"][-2] = 60
        self.assertTrue(bike.needs_reminder(bike.parse_forecast(data, self.target)))

    def test_invalid_forecast_fails_instead_of_reporting_dry(self):
        for value in (None, -1, 101, float("nan"), "60", True):
            with self.subTest(value=value):
                data = forecast(self.target)
                data["hourly"]["precipitation_probability"][1] = value
                with self.assertRaises(bike.ReminderError):
                    bike.parse_forecast(data, self.target)

    def test_missing_and_duplicate_hours_fail(self):
        for change in ("missing", "duplicate"):
            data = forecast(self.target)
            if change == "missing":
                for values in data["hourly"].values():
                    values.pop(2)
            else:
                data["hourly"]["time"][2] = data["hourly"]["time"][1]
            with self.assertRaises(bike.ReminderError):
                bike.parse_forecast(data, self.target)

    def test_snow_and_ice_trigger(self):
        for code, kind in [(73, "snow"), (67, "ice/hail")]:
            hours = bike.parse_forecast(forecast(self.target, 60, code), self.target)
            self.assertTrue(bike.needs_reminder(hours))
            self.assertIn(kind, bike.precipitation_kind(hours))

    def test_dry_test_message_is_not_a_false_weather_warning(self):
        subject, body = bike.compose_email(self.hours([0]), self.target, test=True)
        self.assertIn("[TEST]", subject)
        self.assertIn("normal daily run would stay silent", body)
        self.assertNotIn("Bring your bike inside before tomorrow.", body)

    @patch.dict(os.environ, {"REMINDER_MODE": "dry-run"}, clear=True)
    @patch.object(bike, "fetch_forecast")
    @patch.object(bike, "send_email")
    def test_dry_run_never_sends_even_when_wet(self, send, fetch):
        fetch.return_value = self.hours([100])
        with redirect_stdout(io.StringIO()):
            bike.main()
        send.assert_not_called()

    @patch.dict(os.environ, {"REMINDER_MODE": "scheduled", "RESEND_API_KEY": "test-key", "BIKE_EMAIL_TO": "recipient@example.invalid"})
    @patch.object(bike, "datetime")
    @patch.object(bike, "fetch_forecast")
    @patch.object(bike, "send_email")
    def test_scheduled_dry_day_is_silent_and_uses_next_local_date(self, send, fetch, clock):
        clock.now.return_value = datetime(2026, 12, 31, 12, 45, tzinfo=bike.ZONE)
        fetch.return_value = self.dry_hours
        with redirect_stdout(io.StringIO()):
            bike.main()
        fetch.assert_called_once_with(date(2027, 1, 1))
        send.assert_not_called()

    @patch.dict(os.environ, {"REMINDER_MODE": "scheduled", "RESEND_API_KEY": "test-key", "BIKE_EMAIL_TO": "recipient@example.invalid"})
    @patch.object(bike, "datetime")
    @patch.object(bike, "fetch_forecast")
    @patch.object(bike, "send_email")
    def test_scheduled_rain_sends_once(self, send, fetch, clock):
        clock.now.return_value = datetime(2026, 9, 14, 12, 15, tzinfo=bike.ZONE)
        fetch.return_value = self.wet_hours
        with patch.object(bike, "compose_email", return_value=("subject", "body")):
            with redirect_stdout(io.StringIO()):
                bike.main()
        send.assert_called_once_with("subject", "body", self.target, False)

    @patch.dict(os.environ, {"REMINDER_MODE": "scheduled"})
    @patch.object(bike, "datetime")
    @patch.object(bike, "fetch_forecast")
    def test_off_season_schedule_skips_before_forecast(self, fetch, clock):
        clock.now.return_value = datetime(2026, 9, 14, 13, 0, tzinfo=bike.ZONE)
        self.assertEqual(bike.main(), "outside-noon-window")
        fetch.assert_not_called()

    @patch.dict(os.environ, {"REMINDER_MODE": "test", "RESEND_API_KEY": "test-key", "BIKE_EMAIL_TO": "recipient@example.invalid"})
    @patch.object(bike, "fetch_forecast")
    @patch.object(bike, "send_email")
    def test_explicit_test_sends_once_even_when_dry(self, send, fetch):
        fetch.return_value = self.hours([0])
        with redirect_stdout(io.StringIO()):
            bike.main()
        self.assertEqual(send.call_count, 1)
        self.assertIn("[TEST]", send.call_args.args[0])
        self.assertTrue(send.call_args.args[3])

    @patch.dict(os.environ, {"BIKE_EMAIL_TO": "recipient@example.invalid", "RESEND_API_KEY": "private-key"})
    @patch.object(bike, "request_json", return_value={"id": "accepted"})
    def test_send_uses_secret_and_stable_separate_idempotency_keys(self, request):
        with redirect_stdout(io.StringIO()) as output:
            bike.send_email("subject", "body", self.target)
            bike.send_email("subject", "body", self.target, test=True)
        daily = request.call_args_list[0].args[0]
        test = request.call_args_list[1].args[0]
        self.assertEqual(json.loads(daily.data)["to"], ["recipient@example.invalid"])
        self.assertEqual(daily.get_header("Idempotency-key"), "bike-weather/daily/2026-09-15")
        self.assertNotEqual(daily.get_header("Idempotency-key"), test.get_header("Idempotency-key"))
        self.assertNotIn("recipient", output.getvalue())
        self.assertNotIn("private-key", output.getvalue())

    @patch.object(bike.time, "sleep")
    @patch.object(bike, "urlopen")
    def test_transient_failure_retries_same_request(self, open_url, sleep):
        # Three failures exercise the bounded retry and sanitized error path.
        open_url.side_effect = [HTTPError("private-url", 503, "private", {}, None)] * 3
        with self.assertRaisesRegex(bike.ReminderError, r"Email service request failed \(HTTP 503\)"):
            bike.request_json("request", "Email service")
        self.assertEqual(open_url.call_count, 3)
        self.assertEqual(sleep.call_count, 2)
        self.assertTrue(all(call.args == ("request",) for call in open_url.call_args_list))

    @patch.object(bike, "urlopen", side_effect=HTTPError("secret-url", 403, "private", {}, None))
    def test_permanent_failure_is_sanitized_and_not_retried(self, open_url):
        with self.assertRaisesRegex(bike.ReminderError, r"Email service request failed \(HTTP 403\)"):
            bike.request_json("request", "Email service")
        self.assertEqual(open_url.call_count, 1)

    @patch.object(bike, "urlopen")
    def test_backup_with_updated_forecast_does_not_duplicate_email(self, open_url):
        body = io.BytesIO(b'{"name":"invalid_idempotent_request"}')
        open_url.side_effect = HTTPError("private", 409, "private", {}, body)
        self.assertEqual(bike.request_json("request", "Email service", idempotent=True),
                         {"already_processed": True})
        self.assertEqual(open_url.call_count, 1)

    @patch.object(bike.time, "sleep")
    @patch.object(bike, "urlopen")
    def test_concurrent_sends_retry_without_changing_key(self, open_url, sleep):
        error = HTTPError("private", 409, "private", {},
                          io.BytesIO(b'{"name":"concurrent_idempotent_requests"}'))
        response = unittest.mock.MagicMock()
        response.__enter__.return_value = io.StringIO('{"id":"accepted"}')
        open_url.side_effect = [error, response]
        self.assertEqual(bike.request_json("request", "Email service", idempotent=True), {"id": "accepted"})
        self.assertEqual(open_url.call_count, 2)

    @patch.object(bike, "fetch_forecast")
    @patch.object(bike, "send_email", return_value="reminder-accepted")
    @patch.dict(os.environ, {"RESEND_API_KEY": "test", "BIKE_EMAIL_TO": "recipient@example.invalid"})
    def test_utc_schedules_cover_both_seasons_once_per_endpoint(self, send, fetch):
        from datetime import timezone
        fetch.return_value = self.wet_hours
        for month, active_utc_hour in [(1, 17), (7, 16)]:
            for hour in (16, 17):
                now = datetime(2026, month, 14, hour, 30, tzinfo=timezone.utc).astimezone(bike.ZONE)
                with redirect_stdout(io.StringIO()):
                    result = bike.run("scheduled", now=now)
                self.assertEqual(result, "reminder-accepted" if hour == active_utc_hour else "outside-noon-window")
        self.assertEqual(send.call_count, 2)


if __name__ == "__main__":
    unittest.main()
