# Bike weather reminder

Vercel Cron checks tomorrow's full local calendar day around noon Eastern.
It emails when any hour has at least a 60% precipitation probability, or three
or more hours (not necessarily consecutive) have at least 40%. Rain, snow, and
ice all count. Dry days and isolated low probabilities stay silent. Hourly
probabilities are not independent events to add together.

## Deployment and private configuration

This runs alongside the Jekyll site as Python Vercel Functions. There is no
GitHub Actions schedule. Deploy `main` to the existing Vercel project.

Set these **Production environment variables in Vercel**, marking them sensitive.
Never use public-prefixed variables, committed files, query strings, or browser
code for secrets. Redeploy after changing environment variables.

| Variable | Purpose |
| --- | --- |
| `CRON_SECRET` | Cryptographically random authentication secret, at least 32 characters |
| `BIKE_EMAIL_TO` | Single recipient address |
| `RESEND_API_KEY` | Resend sending API key |
| `WEATHER_LATITUDE` | Forecast latitude |
| `WEATHER_LONGITUDE` | Forecast longitude |
| `WEATHER_LOCATION` | Friendly place name used only in the email |
| `BIKE_EMAIL_FROM` | Optional verified sender; defaults to `Bike reminder <onboarding@resend.dev>` |

Create a [Resend account](https://resend.com/signup) with the recipient's address.
The default `resend.dev` sender can only email that account's own address. To use
another recipient or a custom sender, verify a domain in Resend first. Use a
sending-only API key. Resend receives the recipient and message; Open-Meteo
receives the forecast coordinates. Neither service receives the other's secrets.

## Scheduling and recovery

Vercel's schedules are UTC. `vercel.json` defines 16:00 and 17:00 UTC daily
invocations for both `/api/bike-weather` and `/api/bike-weather-backup`.
Each invocation checks `America/New_York` and only works between noon and 1 PM;
the other UTC schedule returns an authenticated no-op. This covers EDT and EST
without seasonal redeployments. Each cron entry runs once daily, compatible
with Hobby's daily-per-job limit and invocation jitter within the hour.

The backup provides a second opportunity if a primary invocation is missed or
fails. Both use the same daily Resend idempotency key, so a second successful
attempt does not send another email. Keys persist at the provider for 24 hours.
If the forecast changes between attempts, an already-used-key conflict is
handled without sending another message; concurrent-key conflicts retry.
This uses Resend's deduplication, not instance-local memory or files.

Weather and email calls retry transient failures up to three times with bounded
timeouts, within a 60-second function budget. Missing or malformed forecasts
fail explicitly instead of being treated as dry. Responses and logs omit
addresses, coordinates, credentials, email bodies, and provider response bodies.
Both endpoints require Vercel's `Authorization: Bearer CRON_SECRET` header and
return `Cache-Control: no-store`. The automation and API directories are excluded
from the static Jekyll output.

**Limits:** Vercel documents best-effort cron delivery and no platform retries.
The two attempts improve resilience to a missed request; they do not survive
every shared Vercel, weather, or email outage. No scheduler can guarantee inbox
delivery. Runtime errors appear in Vercel Logs, but a missed invocation has no
runtime log. External heartbeat monitoring would be needed to detect both
attempts being missed. No external monitor has been configured.

## Validate and send one test

Local tests: `python3 -m unittest discover -s automation -p 'test_*.py'`.
Local execution of `automation/bike_weather.py` defaults to a dry run; provide
coordinate values through environment variables. Python has no third-party
dependencies.

After deployment, an authenticated **POST** to `/api/bike-weather` with
`X-Reminder-Mode: dry-run` fetches a real forecast without sending email.
Use `X-Reminder-Mode: test` for one clearly labeled delivery test even if dry.
Both require the cron bearer secret. Omitted mode defaults to dry-run. GET is
reserved for scheduled checks; query strings cannot force an email. The
recipient cannot be supplied or changed through the request.

Test and daily keys are separate; repeating a test on the same day is deduplicated
for 24 hours. Provider acceptance is not proof of inbox delivery: check the
recipient inbox/spam folder and the Resend dashboard after the initial test.
To stop reminders, disable cron jobs in the Vercel project settings.

Sources: [Open-Meteo](https://open-meteo.com/en/docs),
[Vercel cron behavior](https://vercel.com/docs/cron-jobs/manage-cron-jobs),
[Python API functions](https://vercel.com/docs/functions/runtimes/python/api-directory),
[Resend sender restrictions](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain),
[Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).
