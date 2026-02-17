import os
import requests
from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for browser requests

# Get API key from environment variable
API_KEY = os.getenv("ANTHROPIC_AUTH_TOKEN", "")
PROPERTIES_FILE = os.path.join(
    os.path.dirname(__file__), "config", "dashboard.properties"
)


def to_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


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

if __name__ == "__main__":
    print("Starting OpenRouter Credit Balance API server on http://localhost:4000")
    print("Endpoint: http://localhost:4000/api/openrouter/balance")
    print("Endpoint: http://localhost:4000/api/github/copilot/premium-usage")
    app.run(port=4000, debug=True)
