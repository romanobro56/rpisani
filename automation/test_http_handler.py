import io
import os
import unittest
from unittest.mock import Mock, patch

from automation.http_handler import ReminderHandler
from automation.bike_weather import ReminderError


class HandlerTests(unittest.TestCase):
    def make_handler(self, headers=None):
        handler = object.__new__(ReminderHandler)
        handler.headers = headers or {}
        handler.respond = Mock()
        return handler

    @patch.dict(os.environ, {"CRON_SECRET": "private"})
    @patch("automation.http_handler.run")
    def test_unauthorized_get_and_post_do_no_work(self, run):
        for headers in ({}, {"Authorization": "Bearer wrong"}):
            for method in ("do_GET", "do_POST"):
                handler = self.make_handler(headers)
                getattr(handler, method)()
                handler.respond.assert_called_once_with(401, "unauthorized")
        run.assert_not_called()

    @patch.dict(os.environ, {}, clear=True)
    @patch("automation.http_handler.run")
    def test_missing_secret_fails_closed(self, run):
        handler = self.make_handler({"Authorization": "Bearer "})
        handler.do_GET()
        handler.respond.assert_called_once_with(401, "unauthorized")
        run.assert_not_called()

    @patch.dict(os.environ, {"CRON_SECRET": "private"})
    @patch("automation.http_handler.run", return_value="quiet")
    def test_get_cannot_force_a_test_email(self, run):
        handler = self.make_handler({"Authorization": "Bearer private", "X-Reminder-Mode": "test"})
        handler.do_GET()
        run.assert_called_once_with("scheduled")

    @patch.dict(os.environ, {"CRON_SECRET": "private"})
    @patch("automation.http_handler.run", return_value="test-accepted")
    def test_authenticated_explicit_post_test(self, run):
        handler = self.make_handler({"Authorization": "Bearer private", "X-Reminder-Mode": "test"})
        handler.do_POST()
        run.assert_called_once_with("test")
        handler.respond.assert_called_once_with(200, "test-accepted")

    @patch.dict(os.environ, {"CRON_SECRET": "private"})
    @patch("automation.http_handler.run", return_value="dry-run-quiet")
    def test_post_defaults_to_no_email(self, run):
        handler = self.make_handler({"Authorization": "Bearer private"})
        handler.do_POST()
        run.assert_called_once_with("dry-run")

    @patch.dict(os.environ, {"CRON_SECRET": "private"})
    @patch("automation.http_handler.run", side_effect=ReminderError("Weather service unavailable."))
    def test_failures_return_503_not_false_success(self, run):
        from contextlib import redirect_stdout
        handler = self.make_handler({"Authorization": "Bearer private"})
        with redirect_stdout(io.StringIO()):
            handler.do_GET()
        handler.respond.assert_called_once_with(503, "reminder-failed")

    def test_responses_cannot_be_cached(self):
        handler = object.__new__(ReminderHandler)
        handler.send_response = Mock()
        handler.send_header = Mock()
        handler.end_headers = Mock()
        handler.wfile = io.BytesIO()
        handler.respond(200, "quiet")
        handler.send_header.assert_any_call("Cache-Control", "no-store")
