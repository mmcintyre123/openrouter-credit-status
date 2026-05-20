const DEFAULT_API_ORIGIN = "http://localhost:4000";

// Prefer an explicit override, but otherwise talk to the backend on the same host
// the browser used to open the frontend so localhost and LAN access both work.
function getApiBaseUrl() {
    const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

    if (configuredBaseUrl) {
        return configuredBaseUrl;
    }

    if (typeof window === "undefined") {
        return DEFAULT_API_ORIGIN;
    }

    // Keep the current hostname and only switch the port to the Flask API.
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:4000`;
}

const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
    openRouterBalance: `${API_BASE_URL}/api/openrouter/balance`,
    copilotPremiumUsage: `${API_BASE_URL}/api/github/copilot/premium-usage`,
    codexLimits: `${API_BASE_URL}/api/openai/codex/limits`,
};
