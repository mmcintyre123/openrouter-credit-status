/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { Card, HStack, Spinner, Text } from "@chakra-ui/react";
import SectionAlert from "../components/SectionAlert.jsx";
import CopilotPremiumPieCard from "../components/copilot/CopilotPremiumPieCard.jsx";
import CodexLimitsPieCard from "../components/codex/CodexLimitsPieCard.jsx";
import OpenRouterBudgetPieCard from "../components/openrouter/OpenRouterBudgetPieCard.jsx";
import { API_ENDPOINTS } from "../api/endpoints.js";
import { useApiResource } from "./useApiResource.js";

const CARD_VISIBILITY_STORAGE_KEY = "usageDashboard.cardVisibility";
const LEGACY_CARD_VISIBILITY_DEFAULTS_STORAGE_KEY =
    "usageDashboard.cardVisibilityDefaults";
const OPENROUTER_CONFIG_VALUE = import.meta.env.VITE_SHOW_OPENROUTER_CARD;
const CARD_OPTIONS = [
    {
        key: "openrouter",
        label: "OpenRouter",
        titleLabel: "OpenRouter",
    },
    {
        key: "copilot",
        label: "GitHub Copilot Pro",
        titleLabel: "Copilot",
    },
    {
        key: "codex",
        label: "ChatGPT Plus Codex",
        titleLabel: "Codex",
    },
];
const COMPACTABLE_CARD_KEYS = ["openrouter", "copilot"];
const DEFAULT_CARD_VISIBILITY = Object.freeze({
    // Read the config-backed env before the dashboard renders so the initial UI
    // always reflects the current startup defaults for this Vite session.
    openrouter: OPENROUTER_CONFIG_VALUE !== "false",
    copilot: true,
    codex: true,
});

function hasVisibleCards(cardVisibility) {
    return Object.values(cardVisibility).some(Boolean);
}

function clearLegacyCardVisibilityStorage() {
    if (typeof window === "undefined") {
        return;
    }

    // Remove stale browser-persistent state from the previous implementation so
    // each new browser/debug session starts from the current env defaults.
    window.localStorage.removeItem(CARD_VISIBILITY_STORAGE_KEY);
    window.localStorage.removeItem(
        LEGACY_CARD_VISIBILITY_DEFAULTS_STORAGE_KEY,
    );
}

function readStoredCardVisibility() {
    if (typeof window === "undefined") {
        return DEFAULT_CARD_VISIBILITY;
    }

    try {
        clearLegacyCardVisibilityStorage();

        const storedValue = window.sessionStorage.getItem(
            CARD_VISIBILITY_STORAGE_KEY,
        );

        if (!storedValue) {
            return DEFAULT_CARD_VISIBILITY;
        }

        const parsedValue = JSON.parse(storedValue);
        const nextCardVisibility = { ...DEFAULT_CARD_VISIBILITY };

        CARD_OPTIONS.forEach(({ key }) => {
            if (typeof parsedValue?.[key] === "boolean") {
                nextCardVisibility[key] = parsedValue[key];
            }
        });

        return hasVisibleCards(nextCardVisibility)
            ? nextCardVisibility
            : DEFAULT_CARD_VISIBILITY;
    } catch {
        return DEFAULT_CARD_VISIBILITY;
    }
}

function LoadingCard({ label }) {
    return (
        <Card.Root
            boxShadow="lg"
            borderWidth="1px"
            borderColor="gray.200"
            h="100%"
        >
            <Card.Body p={4}>
                <HStack gap={3} minH="180px" justify="center" align="center">
                    <Spinner />
                    <Text fontSize="sm">Loading {label}...</Text>
                </HStack>
            </Card.Body>
        </Card.Root>
    );
}

function ErrorCard({ label, error }) {
    return (
        <Card.Root
            boxShadow="lg"
            borderWidth="1px"
            borderColor="gray.200"
            h="100%"
        >
            <Card.Body p={4}>
                <Text fontSize="sm" fontWeight="semibold" mb={3}>
                    {label}
                </Text>
                <SectionAlert
                    status="error"
                    message={error || "Failed to load data."}
                />
            </Card.Body>
        </Card.Root>
    );
}

export function useUsageDashboard() {
    const {
        data: openRouterData,
        status: openRouterStatus,
        error: openRouterError,
        refresh: refreshOpenRouter,
    } = useApiResource(API_ENDPOINTS.openRouterBalance);
    const {
        data: copilotData,
        status: copilotStatus,
        error: copilotError,
        refresh: refreshCopilot,
    } = useApiResource(API_ENDPOINTS.copilotPremiumUsage);
    const {
        data: codexData,
        status: codexStatus,
        error: codexError,
        refresh: refreshCodex,
    } = useApiResource(API_ENDPOINTS.codexLimits);

    const [isCardManagerOpen, setIsCardManagerOpen] = React.useState(false);
    const [cardVisibility, setCardVisibilityState] =
        React.useState(readStoredCardVisibility);
    const [cardCompact, setCardCompact] = React.useState({
        openrouter: false,
        copilot: false,
    });

    React.useEffect(() => {
        window.sessionStorage.setItem(
            CARD_VISIBILITY_STORAGE_KEY,
            JSON.stringify(cardVisibility),
        );
    }, [cardVisibility]);

    const openCardManager = React.useCallback(() => {
        setIsCardManagerOpen(true);
    }, []);

    const closeCardManager = React.useCallback(() => {
        setIsCardManagerOpen(false);
    }, []);

    const setCardVisibility = React.useCallback((cardKey, nextVisible) => {
        setCardVisibilityState((prev) => {
            const isLastVisibleCard =
                prev[cardKey] &&
                !Object.entries(prev).some(
                    ([key, isVisible]) => key !== cardKey && isVisible,
                );

            if (!nextVisible && isLastVisibleCard) {
                return prev;
            }

            return {
                ...prev,
                [cardKey]: nextVisible,
            };
        });
    }, []);

    const visibleCardCount = React.useMemo(
        () => Object.values(cardVisibility).filter(Boolean).length,
        [cardVisibility],
    );
    const visibleCompactableCardKeys = React.useMemo(
        () =>
            COMPACTABLE_CARD_KEYS.filter((cardKey) => cardVisibility[cardKey]),
        [cardVisibility],
    );
    const showCompactToggle = visibleCompactableCardKeys.length > 0;
    const isGlobalCompact =
        visibleCompactableCardKeys.length > 0 &&
        visibleCompactableCardKeys.every((cardKey) => cardCompact[cardKey]);

    const toggleGlobalCompact = React.useCallback(() => {
        setCardCompact((prev) => {
            const nextCompactValue = !visibleCompactableCardKeys.every(
                (cardKey) => prev[cardKey],
            );
            const next = { ...prev };

            visibleCompactableCardKeys.forEach((cardKey) => {
                next[cardKey] = nextCompactValue;
            });

            return next;
        });
    }, [visibleCompactableCardKeys]);

    const toggleCardCompact = React.useCallback((cardKey) => {
        setCardCompact((prev) => ({ ...prev, [cardKey]: !prev[cardKey] }));
    }, []);

    const refreshAll = React.useCallback(async () => {
        const refreshActions = [];

        if (cardVisibility.openrouter) {
            refreshActions.push(refreshOpenRouter());
        }

        if (cardVisibility.copilot) {
            refreshActions.push(refreshCopilot());
        }

        if (cardVisibility.codex) {
            refreshActions.push(refreshCodex());
        }

        await Promise.allSettled([
            ...refreshActions,
        ]);
    }, [cardVisibility, refreshCodex, refreshCopilot, refreshOpenRouter]);

    React.useEffect(() => {
        refreshAll();
        const id = window.setInterval(refreshAll, 60_000);
        return () => window.clearInterval(id);
    }, [refreshAll]);

    const isRefreshing =
        (cardVisibility.openrouter && openRouterStatus === "loading") ||
        (cardVisibility.copilot && copilotStatus === "loading") ||
        (cardVisibility.codex && codexStatus === "loading");
    const showOpenRouterRefreshError =
        cardVisibility.openrouter &&
        openRouterStatus === "error" &&
        Boolean(openRouterData);
    const showCopilotRefreshError =
        cardVisibility.copilot &&
        copilotStatus === "error" &&
        Boolean(copilotData);
    const showCodexRefreshError =
        cardVisibility.codex &&
        codexStatus === "error" &&
        Boolean(codexData);

    const openRouterPie = openRouterData ? (
        <OpenRouterBudgetPieCard
            data={openRouterData}
            isCompact={cardCompact.openrouter}
            onToggleCompact={() => toggleCardCompact("openrouter")}
        />
    ) : openRouterStatus === "error" ? (
        <ErrorCard
            label="OpenRouter Budget Visualization"
            error={openRouterError}
        />
    ) : (
        <LoadingCard label="OpenRouter chart" />
    );

    const copilotPie = copilotData ? (
        <CopilotPremiumPieCard
            data={copilotData}
            isCompact={cardCompact.copilot}
            onToggleCompact={() => toggleCardCompact("copilot")}
        />
    ) : copilotStatus === "error" ? (
        <ErrorCard
            label="Copilot Included Pool Visualization"
            error={copilotError}
        />
    ) : (
        <LoadingCard label="Copilot chart" />
    );

    const codexPie = codexData ? (
        <CodexLimitsPieCard data={codexData} />
    ) : codexStatus === "error" ? (
        <ErrorCard label="ChatGPT Codex Allowance" error={codexError} />
    ) : (
        <LoadingCard label="Codex chart" />
    );

    return {
        refreshAll,
        isRefreshing,
        cardOptions: CARD_OPTIONS,
        cardVisibility,
        visibleCardCount,
        showCompactToggle,
        isCardManagerOpen,
        openCardManager,
        closeCardManager,
        setCardVisibility,
        // showLowBudgetWarning,
        showOpenRouterRefreshError,
        showCopilotRefreshError,
        showCodexRefreshError,
        openRouterError,
        copilotError,
        codexError,
        openRouterPie,
        copilotPie,
        codexPie,
        isGlobalCompact,
        toggleGlobalCompact,
    };
}
