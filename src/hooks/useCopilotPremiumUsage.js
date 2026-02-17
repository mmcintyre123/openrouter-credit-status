import React from "react";

const COPILOT_PREMIUM_USAGE_URL =
    "http://localhost:4000/api/github/copilot/premium-usage";

export function useCopilotPremiumUsage() {
    const [data, setData] = React.useState(null);
    const [status, setStatus] = React.useState("idle");
    const [error, setError] = React.useState("");

    const refresh = React.useCallback(async () => {
        setStatus("loading");
        setError("");

        try {
            const response = await fetch(COPILOT_PREMIUM_USAGE_URL, {
                method: "GET",
                headers: { Accept: "application/json" },
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(
                    `Request failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`,
                );
            }

            const payload = await response.json();
            console.debug("Copilot premium usage payload", {
                totals: payload?.totals,
                billedAmount: payload?.totals?.billedAmount,
                usageItems: Array.isArray(payload?.usageItems)
                    ? payload.usageItems.length
                    : 0,
            });
            setData(payload);
            setStatus("ok");
            return payload;
        } catch (fetchError) {
            setStatus("error");
            setError(fetchError?.message || "Unknown error");
            throw fetchError;
        }
    }, []);

    return { data, status, error, refresh };
}
