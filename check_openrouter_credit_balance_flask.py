import os
import json
import requests
from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime, timezone

app = Flask(__name__)
CORS(app)  # Enable CORS for browser requests

# Get API key from environment variable
API_KEY = os.getenv("ANTHROPIC_AUTH_TOKEN", "")
PROPERTIES_FILE = os.path.join(
    os.path.dirname(__file__), "config", "dashboard.properties"
)
WHAM_USAGE_URL = "https://chatgpt.com/backend-api/wham/usage"
CODEX_AUTH_FILE = os.path.join(os.path.expanduser("~"), ".codex", "auth.json")


def to_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def to_int_or_none(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        try:
            return int(float(value))
        except (TypeError, ValueError):
            return None


def load_dashboard_properties():
    props = {}
    if not os.path.exists(PROPERTIES_FILE):
        return props

    with open(PROPERTIES_FILE, "r", encoding="utf-8") as file:
        for line in file:
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue

            if "=" not in stripped:
                continue

            key, value = stripped.split("=", 1)
            props[key.strip()] = value.strip()

    return props


def get_chatgpt_auth_from_env():
    access_token = os.getenv("CHATGPT_ACCESS_TOKEN", "").strip()
    account_id = os.getenv("CHATGPT_ACCOUNT_ID", "").strip()

    if access_token and account_id:
        return {
            "access_token": access_token,
            "account_id": account_id,
            "source": "environment",
        }

    return None


def get_chatgpt_auth_from_codex_cache():
    if not os.path.exists(CODEX_AUTH_FILE):
        raise FileNotFoundError(f"{CODEX_AUTH_FILE} was not found")

    with open(CODEX_AUTH_FILE, "r", encoding="utf-8") as file:
        payload = json.load(file)

    tokens = payload.get("tokens", {}) if isinstance(payload, dict) else {}
    access_token = str(tokens.get("access_token", "")).strip()
    account_id = str(tokens.get("account_id", "")).strip()

    if not access_token or not account_id:
        raise ValueError(
            f"{CODEX_AUTH_FILE} does not contain tokens.access_token and tokens.account_id"
        )

    return {
        "access_token": access_token,
        "account_id": account_id,
        "source": "codex_auth_cache",
    }


def resolve_chatgpt_auth():
    env_auth = get_chatgpt_auth_from_env()
    if env_auth:
        return env_auth

    partial_env = bool(os.getenv("CHATGPT_ACCESS_TOKEN")) or bool(
        os.getenv("CHATGPT_ACCOUNT_ID")
    )
    if partial_env:
        app.logger.warning(
            "CHATGPT_ACCESS_TOKEN/CHATGPT_ACCOUNT_ID partially set; falling back to %s",
            CODEX_AUTH_FILE,
        )

    return get_chatgpt_auth_from_codex_cache()


def fetch_wham_usage(access_token, account_id):
    headers = {
        "Authorization": f"Bearer {access_token}",
        "ChatGPT-Account-Id": account_id,
        "Accept": "application/json",
    }

    with requests.Session() as session:
        # Avoid broken system proxy env vars for this call.
        session.trust_env = False
        return session.get(
            WHAM_USAGE_URL,
            headers=headers,
            timeout=20,
            proxies={"http": None, "https": None},
        )


def epoch_to_iso_utc(value):
    epoch_value = to_int_or_none(value)
    if epoch_value is None:
        return None

    return datetime.fromtimestamp(epoch_value, tz=timezone.utc).isoformat()


def normalize_wham_window(window, allowed, limit_reached):
    if not isinstance(window, dict):
        return None

    reset_at = to_int_or_none(window.get("reset_at"))

    return {
        "allowed": bool(allowed),
        "limitReached": bool(limit_reached),
        "usedPercent": round(to_float(window.get("used_percent")), 2),
        "windowSeconds": to_int_or_none(window.get("limit_window_seconds")),
        "resetAfterSeconds": to_int_or_none(window.get("reset_after_seconds")),
        "resetAtEpoch": reset_at,
        "resetAtIso": epoch_to_iso_utc(reset_at),
    }


def normalize_rate_limit_block(rate_limit):
    if not isinstance(rate_limit, dict):
        return {"primary": None, "secondary": None}

    allowed = rate_limit.get("allowed", False)
    limit_reached = rate_limit.get("limit_reached", False)

    return {
        "primary": normalize_wham_window(
            rate_limit.get("primary_window"), allowed, limit_reached
        ),
        "secondary": normalize_wham_window(
            rate_limit.get("secondary_window"), allowed, limit_reached
        ),
    }


def normalize_credits(credits):
    if not isinstance(credits, dict):
        return {
            "hasCredits": False,
            "unlimited": False,
            "balance": 0.0,
        }

    return {
        "hasCredits": bool(credits.get("has_credits")),
        "unlimited": bool(credits.get("unlimited")),
        "balance": round(to_float(credits.get("balance")), 4),
    }


@app.route('/api/openrouter/balance')
def get_balance():
    if not API_KEY:
        return jsonify({"error": "ANTHROPIC_AUTH_TOKEN environment variable is not set"}), 500
    
    url = "https://openrouter.ai/api/v1/key"
    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json().get('data', {})

        remaining = data.get('limit_remaining', 0)
        total_limit = data.get('limit', 0)
        reset_period = data.get('limit_reset', 'N/A')
        usage = data.get('usage', 0)
        usage_daily = data.get('usage_daily', 0)
        usage_weekly = data.get('usage_weekly', 0)
        usage_monthly = data.get('usage_monthly', 0)

        percent_remaining = (remaining / total_limit * 100) if total_limit > 0 else 0
        warning_low_budget = percent_remaining < 10

        return jsonify({
            "totalLimit": total_limit,
            "remaining": remaining,
            "resetPeriod": reset_period,
            "usage": usage,
            "usageDaily": usage_daily,
            "usageWeekly": usage_weekly,
            "usageMonthly": usage_monthly,
            "percentRemaining": round(percent_remaining, 1),
            "warningLowBudget": warning_low_budget,
            "fetchedAt": datetime.now().isoformat()
        })

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Request failed: {str(e)}"}), 500
    except ValueError as e:
        return jsonify({"error": f"Failed to parse response: {str(e)}"}), 500


# todo Break this up into smaller, more single-purpose functions called by a more readable orchestrator function. 
@app.route('/api/github/copilot/premium-usage')
def get_copilot_premium_usage():
    github_pat = os.getenv("GITHUB_PAT", "")
    properties = load_dashboard_properties()
    github_username = properties.get("GITHUB_USERNAME", "")
    monthly_limit_raw = properties.get("COPILOT_PRO_MONTHLY_LIMIT", "300")

    if not github_pat:
        return jsonify({"error": "GITHUB_PAT environment variable is not set"}), 500

    if not github_username:
        return jsonify({
            "error": "GITHUB_USERNAME is not set in config/dashboard.properties"
        }), 500

    monthly_limit = to_float(monthly_limit_raw)
    if monthly_limit <= 0:
        monthly_limit = 300.0

    url = f"https://api.github.com/users/{github_username}/settings/billing/premium_request/usage"
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {github_pat}",
        "X-GitHub-Api-Version": "2022-11-28"
    }

    try:
        response = requests.get(url, headers=headers, timeout=20)
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"GitHub request failed: {str(e)}"}), 502

    if response.status_code >= 400:
        text = response.text.strip()
        return jsonify({
            "error": f"GitHub API request failed with status {response.status_code}",
            "details": text[:1000]
        }), 502

    try:
        payload = response.json()
    except ValueError as e:
        return jsonify({"error": f"Failed to parse GitHub response: {str(e)}"}), 500

    usage_items = payload.get("usageItems", [])

    included_used = sum(to_float(item.get("discountQuantity")) for item in usage_items)
    gross_used = sum(to_float(item.get("grossQuantity")) for item in usage_items)
    net_overage = sum(to_float(item.get("netQuantity")) for item in usage_items)
    billed_amount = sum(to_float(item.get("netAmount")) for item in usage_items)

    included_remaining = max(monthly_limit - included_used, 0.0)
    included_percent_used = min((included_used / monthly_limit * 100.0), 100.0) if monthly_limit > 0 else 0.0

    totals = {
        "includedUsed": round(included_used, 4),
        "includedRemaining": round(included_remaining, 4),
        "includedPercentUsed": round(included_percent_used, 1),
        "grossUsed": round(gross_used, 4),
        "netOverage": round(net_overage, 4),
        "billedAmount": round(billed_amount, 4)
    }

    app.logger.info(
        "Copilot usage totals computed | user=%s | totals=%s",
        payload.get("user", github_username),
        totals,
    )

    return jsonify({
        "plan": {
            "name": "Copilot Pro",
            "monthlyLimit": round(monthly_limit, 2)
        },
        "user": payload.get("user", github_username),
        "timePeriod": payload.get("timePeriod", {}),
        "totals": totals,
        "usageItems": usage_items,
        "fetchedAt": datetime.now().isoformat()
    })


@app.route('/api/openai/codex/limits')
def get_openai_codex_limits():
    try:
        auth = resolve_chatgpt_auth()
    except (FileNotFoundError, ValueError, json.JSONDecodeError) as e:
        return jsonify({
            "error": "ChatGPT Codex auth is unavailable. Set CHATGPT_ACCESS_TOKEN and CHATGPT_ACCOUNT_ID or sign in with Codex CLI.",
            "details": str(e)
        }), 500

    try:
        response = fetch_wham_usage(
            auth.get("access_token", ""),
            auth.get("account_id", ""),
        )
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"ChatGPT Codex usage request failed: {str(e)}"}), 502

    if response.status_code >= 400:
        return jsonify({
            "error": f"ChatGPT Codex usage API request failed with status {response.status_code}",
            "details": response.text.strip()[:1000]
        }), 502

    try:
        payload = response.json()
    except ValueError as e:
        return jsonify({"error": f"Failed to parse ChatGPT Codex usage response: {str(e)}"}), 500

    if not isinstance(payload, dict):
        return jsonify({"error": "Unexpected ChatGPT Codex usage response shape: expected JSON object"}), 500

    rate_limit = payload.get("rate_limit")
    if not isinstance(rate_limit, dict):
        return jsonify({"error": "Unexpected ChatGPT Codex usage response shape: missing rate_limit"}), 500

    code_review_rate_limit = payload.get("code_review_rate_limit")
    if code_review_rate_limit is not None and not isinstance(code_review_rate_limit, dict):
        return jsonify({"error": "Unexpected ChatGPT Codex usage response shape: invalid code_review_rate_limit"}), 500

    app.logger.info(
        "Codex limits fetched | source=%s | plan=%s",
        auth.get("source"),
        payload.get("plan_type", "unknown"),
    )

    return jsonify({
        "planType": payload.get("plan_type", ""),
        "limits": normalize_rate_limit_block(rate_limit),
        "codeReviewLimits": normalize_rate_limit_block(code_review_rate_limit),
        "credits": normalize_credits(payload.get("credits")),
        "fetchedAt": datetime.now().isoformat()
    })


if __name__ == "__main__":
    print("Starting OpenRouter Credit Balance API server on http://localhost:4000")
    print("Endpoint: http://localhost:4000/api/openrouter/balance")
    print("Endpoint: http://localhost:4000/api/github/copilot/premium-usage")
    print("Endpoint: http://localhost:4000/api/openai/codex/limits")
    app.run(port=4000, debug=True)
