import requests

from backend.config import GITHUB_PREMIUM_USAGE_URL_TEMPLATE
from backend.helpers.common import ServiceError, now_iso, to_float


def fetch_copilot_premium_usage(github_pat, github_username, monthly_limit):
    url = GITHUB_PREMIUM_USAGE_URL_TEMPLATE.format(github_username=github_username)
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {github_pat}",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    try:
        with requests.Session() as session:
            session.trust_env = False
            response = session.get(
                url,
                headers=headers,
                timeout=20,
                proxies={"http": None, "https": None},
            )
    except requests.exceptions.RequestException as exc:
        raise ServiceError(
            f"GitHub request failed: {exc}",
            status_code=502,
        ) from exc

    if response.status_code >= 400:
        text = response.text.strip()
        raise ServiceError(
            f"GitHub API request failed with status {response.status_code}",
            status_code=502,
            details=text[:1000],
        )

    try:
        payload = response.json()
    except ValueError as exc:
        raise ServiceError(
            f"Failed to parse GitHub response: {exc}",
            status_code=500,
        ) from exc

    usage_items = payload.get("usageItems", [])
    included_used = sum(to_float(item.get("discountQuantity")) for item in usage_items)
    gross_used = sum(to_float(item.get("grossQuantity")) for item in usage_items)
    net_overage = sum(to_float(item.get("netQuantity")) for item in usage_items)
    billed_amount = sum(to_float(item.get("netAmount")) for item in usage_items)

    included_remaining = max(monthly_limit - included_used, 0.0)
    if monthly_limit > 0:
        included_percent_used = min((included_used / monthly_limit * 100.0), 100.0)
    else:
        included_percent_used = 0.0

    totals = {
        "includedUsed": round(included_used, 4),
        "includedRemaining": round(included_remaining, 4),
        "includedPercentUsed": round(included_percent_used, 1),
        "grossUsed": round(gross_used, 4),
        "netOverage": round(net_overage, 4),
        "billedAmount": round(billed_amount, 4),
    }

    return {
        "plan": {"name": "Copilot Pro", "monthlyLimit": round(monthly_limit, 2)},
        "user": payload.get("user", github_username),
        "timePeriod": payload.get("timePeriod", {}),
        "totals": totals,
        "usageItems": usage_items,
        "fetchedAt": now_iso(),
    }
