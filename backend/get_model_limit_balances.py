import os

from flask import current_app, jsonify

from backend.config import PROPERTIES_FILE
from backend.helpers.codex_helper import fetch_codex_limits
from backend.helpers.common import ServiceError, load_dashboard_properties, to_float
from backend.helpers.copilot_helper import fetch_copilot_premium_usage
from backend.helpers.openrouter_helper import fetch_openrouter_balance


def to_error_response(error):
    payload = {"error": error.message}
    if error.details:
        payload["details"] = error.details
    return jsonify(payload), error.status_code


def get_openrouter_balance_route():
    api_key = os.getenv("ANTHROPIC_AUTH_TOKEN", "")
    if not api_key:
        return jsonify({"error": "ANTHROPIC_AUTH_TOKEN environment variable is not set"}), 500

    try:
        result = fetch_openrouter_balance(api_key)
        return jsonify(result)
    except ServiceError as error:
        return to_error_response(error)


def get_copilot_premium_usage_route():
    github_pat = os.getenv("GITHUB_PAT", "")
    properties = load_dashboard_properties(PROPERTIES_FILE)
    github_username = properties.get("GITHUB_USERNAME", "")
    monthly_limit_raw = properties.get("COPILOT_PRO_MONTHLY_LIMIT", "300")

    if not github_pat:
        return jsonify({"error": "GITHUB_PAT environment variable is not set"}), 500

    if not github_username:
        return jsonify({"error": "GITHUB_USERNAME is not set in config/dashboard.properties"}), 500

    monthly_limit = to_float(monthly_limit_raw)
    if monthly_limit <= 0:
        monthly_limit = 300.0

    try:
        result = fetch_copilot_premium_usage(
            github_pat=github_pat,
            github_username=github_username,
            monthly_limit=monthly_limit,
        )
        current_app.logger.info(
            "Copilot usage totals computed | user=%s | totals=%s",
            result.get("user", github_username),
            result.get("totals", {}),
        )
        return jsonify(result)
    except ServiceError as error:
        return to_error_response(error)


def get_openai_codex_limits_route():
    try:
        result, auth_source, plan_type = fetch_codex_limits()
        current_app.logger.info(
            "Codex limits fetched | source=%s | plan=%s",
            auth_source,
            plan_type,
        )
        return jsonify(result)
    except ServiceError as error:
        return to_error_response(error)


def register_routes(app):
    app.add_url_rule(
        "/api/openrouter/balance",
        endpoint="get_openrouter_balance_route",
        view_func=get_openrouter_balance_route,
        methods=["GET"],
    )
    app.add_url_rule(
        "/api/github/copilot/premium-usage",
        endpoint="get_copilot_premium_usage_route",
        view_func=get_copilot_premium_usage_route,
        methods=["GET"],
    )
    app.add_url_rule(
        "/api/openai/codex/limits",
        endpoint="get_openai_codex_limits_route",
        view_func=get_openai_codex_limits_route,
        methods=["GET"],
    )
