import unittest

from backend.helpers.codex_helper import normalize_credits


class CodexHelperTests(unittest.TestCase):
    def test_normalizes_credit_balance_for_currency_display(self):
        result = normalize_credits(
            {
                "has_credits": True,
                "unlimited": False,
                "balance": "370.6079075000",
            }
        )

        self.assertTrue(result["hasCredits"])
        self.assertFalse(result["unlimited"])
        self.assertEqual(result["balance"], 370.6079)
        self.assertEqual(result["balanceCredits"], 370)
        self.assertEqual(result["balanceUsd"], 14.8)
        self.assertEqual(result["currency"], "USD")

    def test_returns_zero_balance_when_credits_are_missing(self):
        result = normalize_credits(None)

        self.assertFalse(result["hasCredits"])
        self.assertEqual(result["balanceCredits"], 0)
        self.assertEqual(result["balanceUsd"], 0.0)


if __name__ == "__main__":
    unittest.main()
