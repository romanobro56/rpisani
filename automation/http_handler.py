"""Authenticated Vercel endpoints; responses never contain private forecast data."""

import hmac
import json
import os
from http.server import BaseHTTPRequestHandler

from automation.bike_weather import ReminderError, run


class ReminderHandler(BaseHTTPRequestHandler):
    def respond(self, code, status):
        body = json.dumps({"status": status}).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def authorized(self):
        secret = os.environ.get("CRON_SECRET", "")
        supplied = self.headers.get("Authorization", "")
        return bool(secret) and hmac.compare_digest(supplied.encode(), ("Bearer " + secret).encode())

    def execute(self, mode):
        try:
            result = run(mode)
            self.respond(200, result)
        except ReminderError as error:
            print(f"Bike reminder failed: {error}", flush=True)
            self.respond(503, "reminder-failed")
        except Exception:
            print("Bike reminder failed unexpectedly; private details suppressed.", flush=True)
            self.respond(500, "reminder-failed")

    def do_GET(self):
        if not self.authorized():
            return self.respond(401, "unauthorized")
        self.execute("scheduled")

    def do_POST(self):
        if not self.authorized():
            return self.respond(401, "unauthorized")
        # Test is explicit and authenticated; GET/query-string inputs cannot
        # force an email, and the caller cannot override the recipient.
        mode = self.headers.get("X-Reminder-Mode", "dry-run")
        if mode not in ("dry-run", "test"):
            return self.respond(400, "invalid-mode")
        self.execute(mode)

    def log_message(self, format, *args):
        # The base implementation logs user-controlled URLs. Keep these out
        # of runtime logs, along with all authentication headers and bodies.
        pass
