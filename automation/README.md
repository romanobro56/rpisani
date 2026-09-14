# Bike weather reminder

The `Bike weather reminder` GitHub Actions workflow checks tomorrow's full local
calendar day at noon in `America/New_York`, including daylight-saving changes.
It sends one email when any hour has at least a 60% precipitation probability,
or three or more hours (not necessarily consecutive) have at least 40%.
Rain, snow, and ice all count; dry days and isolated low probabilities stay silent.
These are hourly probabilities, not independent events to add together.

## Private configuration

Set these **GitHub Actions secrets**, never repository variables or committed files:

| Secret | Purpose |
| --- | --- |
| `BIKE_EMAIL_TO` | Single recipient address |
| `RESEND_API_KEY` | Resend sending API key |
| `WEATHER_LATITUDE` | Forecast latitude |
| `WEATHER_LONGITUDE` | Forecast longitude |
| `WEATHER_LOCATION` | Friendly place name used only in the email |
| `BIKE_EMAIL_FROM` | Optional verified sender; defaults to `Bike reminder <onboarding@resend.dev>` |

Create a [Resend account](https://resend.com/signup) with the recipient's address.
The default `resend.dev` sender can only email that account's own address.
To use another recipient or a custom sender, verify a domain in Resend first.
Use a sending-only key. Paste it directly into GitHub's secret form, not a chat,
commit, command argument, or issue. Resend receives the recipient and message;
Open-Meteo receives the forecast coordinates.

## Run and test

In Actions → Bike weather reminder → Run workflow:

- `dry-run` (default): fetch and validate a live forecast; never send email.
- `test`: send one clearly labeled message with the actual forecast even if dry.

Scheduled runs apply the rain thresholds. Manual runs are owner/collaborator
controlled and never accept a recipient input. Neither push nor pull-request
events can invoke this workflow. Actions are pinned, checkout credentials are
not persisted, and the workflow token has read-only contents permission.

Local tests: `python3 -m unittest discover -s automation -p 'test_*.py'`.
Local execution defaults to a dry run; supply coordinate secrets through the
environment. No third-party Python dependencies are required.

## Operations and limits

- GitHub's scheduler is best effort: jobs can be delayed or dropped. A scheduled
  run outside noon–1 PM Eastern fails instead of delivering a stale reminder.
  This is not a guaranteed-delivery or guaranteed-timing service.
- **Public-repository schedules are disabled after 60 days without repository
  activity.** Re-enable in Actions if this happens. For unattended service in an
  inactive repository, migrate the schedule to a dedicated hosting service.
- Missing/invalid forecast hours or unavailable services fail the workflow;
  they are never treated as a dry forecast. Enable GitHub Actions failure
  notifications to hear about these errors.
- Temporary network/server failures retry up to three times. Resend idempotency
  keys protect retries and duplicate daily sends for 24 hours; test keys are
  separate. Re-running after a forecast changes may produce HTTP 409 rather than
  sending a second email. Provider acceptance does not prove inbox delivery;
  check the inbox/spam folder and Resend dashboard for the first test.
- Logs omit addresses, coordinates, credentials, email bodies, and API response
  bodies. No forecast artifacts are uploaded. Secret values stay out of Jekyll's
  output; the automation directory is also excluded from the site build.
- To stop reminders, disable the workflow in GitHub Actions.

Sources: [Open-Meteo hourly fields](https://open-meteo.com/en/docs),
[GitHub schedules](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule),
[Resend sender restrictions](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain),
[Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).
