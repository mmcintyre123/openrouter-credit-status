import unittest
from unittest.mock import patch

from backend.helpers.openrouter_helper import fetch_openrouter_usage


class FakeResponse:
    def raise_for_status(self):
        return None

    def json(self):
        return {
            "data": {
                "label": "Personal key",
                "limit": None,
                "limit_remaining": None,
                "usage": 28.59,
                "usage_daily": 8.57,
                "usage_weekly": 10.25,
                "usage_monthly": 17.75,
            }
        }


class FakeSession:
    trust_env = True

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return None

    def get(self, *_args, **_kwargs):
        return FakeResponse()


class OpenRouterHelperTests(unittest.TestCase):
    @patch("backend.helpers.openrouter_helper.requests.Session", return_value=FakeSession())
    def test_normalizes_pay_as_you_go_usage_periods(self, _session):
        result = fetch_openrouter_usage("test-key")

        self.assertEqual(result["keyLabel"], "Personal key")
        self.assertEqual(result["usageToday"], 8.57)
        self.assertEqual(result["usageThisWeek"], 10.25)
        self.assertEqual(result["usageThisMonth"], 17.75)
        self.assertEqual(result["usageAllTime"], 28.59)
        self.assertEqual(result["usageTimezone"], "UTC")
        self.assertEqual(result["weekStartsOn"], "Monday")
        self.assertIn("fetchedAt", result)


if __name__ == "__main__":
    unittest.main()
