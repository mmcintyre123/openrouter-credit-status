import requests

from backend.config import OPENROUTER_KEY_URL
from backend.helpers.common import ServiceError, now_iso

# Module-level baseline for session usage tracking. Initialized on first request per process lifetime.
# NOTE: Not thread-safe — assumes single-threaded or single-worker deployment (typical for this dashboard).
OPENROUTER_SESSION_BASELINE_USAGE = None
OPENROUTER_SESSION_BASELINE_SET_AT = None


def _set_session_baseline(usage_value):
    global OPENROUTER_SESSION_BASELINE_USAGE, OPENROUTER_SESSION_BASELINE_SET_AT

    OPENROUTER_SESSION_BASELINE_USAGE = usage_value
    OPENROUTER_SESSION_BASELINE_SET_AT = now_iso()


def _compute_session_usage(all_time_usage):
    """
    Calculate OpenRouter usage growth during the current backend process session.

    :param all_time_usage: Current all-time usage reported by OpenRouter.
    :returns: Non-negative float usage delta from the process-session baseline.
    :raises: None.
    """
    global OPENROUTER_SESSION_BASELINE_USAGE, OPENROUTER_SESSION_BASELINE_SET_AT

    usage_value = float(all_time_usage or 0)
    if OPENROUTER_SESSION_BASELINE_USAGE is None:
        _set_session_baseline(usage_value)

    # If upstream value decreases (provider reset/anomaly), clamp baseline to maintain non-negative session delta.
    if usage_value < OPENROUTER_SESSION_BASELINE_USAGE:
        _set_session_baseline(usage_value)

    return max(usage_value - OPENROUTER_SESSION_BASELINE_USAGE, 0.0)


def fetch_openrouter_balance(api_key):
    """
    Fetch and normalize OpenRouter budget data for dashboard consumption.

    :param api_key: OpenRouter API key used for authenticated requests.
    :returns: Dictionary containing normalized budget/usage metrics and derived fields.
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
    except requests.exceptions.RequestException as exc:
        raise ServiceError(f"Request failed: {exc}", status_code=500) from exc
    except ValueError as exc:
        raise ServiceError(
            f"Failed to parse response: {exc}",
            status_code=500,
        ) from exc

    # Normalize upstream fields; double-guard with `or 0` handles both None and missing keys.
    remaining = float(data.get("limit_remaining", 0) or 0)
    total_limit = float(data.get("limit", 0) or 0)
    reset_period = data.get("limit_reset", "N/A")
    usage = float(data.get("usage", 0) or 0)
    usage_daily = float(data.get("usage_daily", 0) or 0)
    usage_weekly = float(data.get("usage_weekly", 0) or 0)  # TODO: expose in UI
    usage_monthly = float(data.get("usage_monthly", 0) or 0)  # TODO: expose in UI
    session_usage = _compute_session_usage(usage)

    # budget_used = spend against the current budget period (not all-time); drives the pie chart.
    budget_used = max(total_limit - remaining, 0.0)

    # percent_remaining drives the center label and low-budget warning threshold.
    percent_remaining = (remaining / total_limit * 100) if total_limit > 0 else 0

    return {
        "totalLimit": total_limit,
        "remaining": remaining,
        "budgetUsed": budget_used,
        "resetPeriod": reset_period,
        "usage": usage,
        "usageWeekly": usage_weekly,
        "usageMonthly": usage_monthly,
        "providerDailyUsage": usage_daily,
        "sessionUsage": session_usage,
        "sessionStartedAt": OPENROUTER_SESSION_BASELINE_SET_AT,
        "percentRemaining": round(percent_remaining, 1),
        "fetchedAt": now_iso(),
    }
