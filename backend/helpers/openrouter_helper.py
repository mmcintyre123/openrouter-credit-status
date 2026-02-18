import requests

from backend.config import OPENROUTER_KEY_URL
from backend.helpers.common import ServiceError, now_iso


def fetch_openrouter_balance(api_key):
    headers = {"Authorization": f"Bearer {api_key}"}

    try:
        with requests.Session() as session:
            session.trust_env = False
            response = session.get(
                OPENROUTER_KEY_URL,
                headers=headers,
                timeout=20,
                proxies={"http": None, "https": None},
            )
            response.raise_for_status()
            data = response.json().get("data", {})
    except requests.exceptions.RequestException as exc:
        raise ServiceError(f"Request failed: {exc}", status_code=500) from exc
    except ValueError as exc:
        raise ServiceError(
            f"Failed to parse response: {exc}",
            status_code=500,
        ) from exc

    remaining = data.get("limit_remaining", 0)
    total_limit = data.get("limit", 0)
    reset_period = data.get("limit_reset", "N/A")
    usage = data.get("usage", 0)
    usage_daily = data.get("usage_daily", 0)
    usage_weekly = data.get("usage_weekly", 0)
    usage_monthly = data.get("usage_monthly", 0)

    percent_remaining = (remaining / total_limit * 100) if total_limit > 0 else 0
    warning_low_budget = percent_remaining < 10

    return {
        "totalLimit": total_limit,
        "remaining": remaining,
        "resetPeriod": reset_period,
        "usage": usage,
        "usageDaily": usage_daily,
        "usageWeekly": usage_weekly,
        "usageMonthly": usage_monthly,
        "percentRemaining": round(percent_remaining, 1),
        "warningLowBudget": warning_low_budget,
        "fetchedAt": now_iso(),
    }
