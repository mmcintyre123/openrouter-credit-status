import os
import requests
from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for browser requests

# Get API key from environment variable
API_KEY = os.getenv("ANTHROPIC_AUTH_TOKEN", "")

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

if __name__ == "__main__":
    print("Starting OpenRouter Credit Balance API server on http://localhost:4000")
    print("Endpoint: http://localhost:4000/api/openrouter/balance")
    app.run(port=4000, debug=True)
