const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export const API_ENDPOINTS = {
    openRouterBalance: `${API_BASE_URL}/api/openrouter/balance`,
    copilotPremiumUsage: `${API_BASE_URL}/api/github/copilot/premium-usage`,
    codexLimits: `${API_BASE_URL}/api/openai/codex/limits`,
};
