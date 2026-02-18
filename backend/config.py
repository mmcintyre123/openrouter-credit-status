from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
PROPERTIES_FILE = BASE_DIR / "config" / "dashboard.properties"
CODEX_AUTH_FILE = Path.home() / ".codex" / "auth.json"
OPENROUTER_KEY_URL = "https://openrouter.ai/api/v1/key"
WHAM_USAGE_URL = "https://chatgpt.com/backend-api/wham/usage"
GITHUB_PREMIUM_USAGE_URL_TEMPLATE = (
    "https://api.github.com/users/{github_username}/settings/billing/premium_request/usage"
)
