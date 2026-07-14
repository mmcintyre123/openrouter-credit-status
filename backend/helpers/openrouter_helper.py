import requests

from backend.config import OPENROUTER_CREDITS_URL, OPENROUTER_KEY_URL
from backend.helpers.common import ServiceError, now_iso

def fetch_openrouter_usage(api_key):
    """
    Fetch and normalize OpenRouter pay-as-you-go usage for dashboard consumption.

    :param api_key: OpenRouter API key used for authenticated requests.
    :returns: Dictionary containing normalized UTC usage periods.
    :raises ServiceError: If the upstream request fails or response parsing fails.
    """
    headers = {"Authorization": f"Bearer {api_key}"}

    try:
        # trust_env=False + explicit null proxies keep requests independent from host proxy env.
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

            credits_response = session.get(
                OPENROUTER_CREDITS_URL,
                headers=headers,
                timeout=20,
                proxies={"http": None, "https": None},
            )
            credits_response.raise_for_status()
            credits_data = credits_response.json().get("data", {})
    except requests.exceptions.RequestException as exc:
        raise ServiceError(f"Request failed: {exc}", status_code=500) from exc
    except ValueError as exc:
        raise ServiceError(
            f"Failed to parse response: {exc}",
            status_code=500,
        ) from exc

    total_credits = float(credits_data.get("total_credits", 0) or 0)
    total_usage = float(credits_data.get("total_usage", 0) or 0)

    return {
        "keyLabel": data.get("label"),
        "creditBalance": max(total_credits - total_usage, 0),
        "usageToday": float(data.get("usage_daily", 0) or 0),
        "usageThisWeek": float(data.get("usage_weekly", 0) or 0),
        "usageThisMonth": float(data.get("usage_monthly", 0) or 0),
        "usageAllTime": float(data.get("usage", 0) or 0),
        "usageTimezone": "UTC",
        "weekStartsOn": "Monday",
        "fetchedAt": now_iso(),
    }
