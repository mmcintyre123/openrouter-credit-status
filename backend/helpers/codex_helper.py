import json
import os

import requests

from backend.config import CODEX_AUTH_FILE, WHAM_USAGE_URL
from backend.helpers.common import (
    ServiceError,
    epoch_to_iso_utc,
    now_iso,
    to_float,
    to_int_or_none,
)


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
    if not CODEX_AUTH_FILE.exists():
        raise FileNotFoundError(f"{CODEX_AUTH_FILE} was not found")

    with CODEX_AUTH_FILE.open("r", encoding="utf-8") as file:
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

    return get_chatgpt_auth_from_codex_cache()


def fetch_wham_usage(access_token, account_id):
    headers = {
        "Authorization": f"Bearer {access_token}",
        "ChatGPT-Account-Id": account_id,
        "Accept": "application/json",
    }

    with requests.Session() as session:
        session.trust_env = False
        return session.get(
            WHAM_USAGE_URL,
            headers=headers,
            timeout=20,
            proxies={"http": None, "https": None},
        )


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
            rate_limit.get("primary_window"),
            allowed,
            limit_reached,
        ),
        "secondary": normalize_wham_window(
            rate_limit.get("secondary_window"),
            allowed,
            limit_reached,
        ),
    }


def normalize_credits(credits):
    if not isinstance(credits, dict):
        return {"hasCredits": False, "unlimited": False, "balance": 0.0}

    return {
        "hasCredits": bool(credits.get("has_credits")),
        "unlimited": bool(credits.get("unlimited")),
        "balance": round(to_float(credits.get("balance")), 4),
    }


# TODO break this up into smaller more single purpose functions
def fetch_codex_limits():
    try:
        auth = resolve_chatgpt_auth()
    except (FileNotFoundError, ValueError, json.JSONDecodeError) as exc:
        raise ServiceError(
            "ChatGPT Codex auth is unavailable. Set CHATGPT_ACCESS_TOKEN and "
            "CHATGPT_ACCOUNT_ID or sign in with Codex CLI.",
            status_code=500,
            details=str(exc),
        ) from exc

    try:
        response = fetch_wham_usage(
            auth.get("access_token", ""),
            auth.get("account_id", ""),
        )
    except requests.exceptions.RequestException as exc:
        raise ServiceError(
            f"ChatGPT Codex usage request failed: {exc}",
            status_code=502,
        ) from exc

    if response.status_code >= 400:
        raise ServiceError(
            f"ChatGPT Codex usage API request failed with status {response.status_code}",
            status_code=502,
            details=response.text.strip()[:1000],
        )

    try:
        payload = response.json()
    except ValueError as exc:
        raise ServiceError(
            f"Failed to parse ChatGPT Codex usage response: {exc}",
            status_code=500,
        ) from exc

    if not isinstance(payload, dict):
        raise ServiceError(
            "Unexpected ChatGPT Codex usage response shape: expected JSON object",
            status_code=500,
        )

    rate_limit = payload.get("rate_limit")
    if not isinstance(rate_limit, dict):
        raise ServiceError(
            "Unexpected ChatGPT Codex usage response shape: missing rate_limit",
            status_code=500,
        )

    code_review_rate_limit = payload.get("code_review_rate_limit")
    if code_review_rate_limit is not None and not isinstance(
        code_review_rate_limit, dict
    ):
        raise ServiceError(
            "Unexpected ChatGPT Codex usage response shape: invalid code_review_rate_limit",
            status_code=500,
        )

    response_payload = {
        "planType": payload.get("plan_type", ""),
        "limits": normalize_rate_limit_block(rate_limit),
        "codeReviewLimits": normalize_rate_limit_block(code_review_rate_limit),
        "credits": normalize_credits(payload.get("credits")),
        "fetchedAt": now_iso(),
    }
    return response_payload, auth.get("source"), payload.get("plan_type", "unknown")
