import React from "react";

export function useApiResource(url) {
    const [data, setData] = React.useState(null);
    const [status, setStatus] = React.useState("idle");
    const [error, setError] = React.useState("");

    const refresh = React.useCallback(async () => {
        setStatus("loading");
        setError("");

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: { Accept: "application/json" },
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(
                    `Request failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`
                );
            }

            const payload = await response.json();
            setData(payload);
            setStatus("ok");
            return payload;
        } catch (fetchError) {
            setStatus("error");
            setError(fetchError?.message || "Unknown error");
            throw fetchError;
        }
    }, [url]);

    return { data, status, error, refresh };
}
