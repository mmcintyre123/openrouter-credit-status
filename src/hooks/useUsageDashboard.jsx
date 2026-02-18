/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { Card, HStack, Spinner, Text } from "@chakra-ui/react";
import SectionAlert from "../components/SectionAlert.jsx";
import CopilotPremiumPieCard from "../components/copilot/CopilotPremiumPieCard.jsx";
import CodexLimitsPieCard from "../components/codex/CodexLimitsPieCard.jsx";
import OpenRouterBudgetPieCard from "../components/openrouter/OpenRouterBudgetPieCard.jsx";
import { API_ENDPOINTS } from "../api/endpoints.js";
import { useApiResource } from "./useApiResource.js";

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

    const refreshAll = React.useCallback(async () => {
        await Promise.allSettled([
            refreshOpenRouter(),
            refreshCopilot(),
            refreshCodex(),
        ]);
    }, [refreshCodex, refreshCopilot, refreshOpenRouter]);

    React.useEffect(() => {
        refreshAll();
        const id = window.setInterval(refreshAll, 60_000);
        return () => window.clearInterval(id);
    }, [refreshAll]);

    const isRefreshing =
        openRouterStatus === "loading" ||
        copilotStatus === "loading" ||
        codexStatus === "loading";
    const openRouterPercent = Number(openRouterData?.percentRemaining ?? 0);
    const showLowBudgetWarning =
        Boolean(openRouterData?.warningLowBudget) || openRouterPercent < 10;
    const showOpenRouterRefreshError =
        openRouterStatus === "error" && Boolean(openRouterData);
    const showCopilotRefreshError =
        copilotStatus === "error" && Boolean(copilotData);
    const showCodexRefreshError = codexStatus === "error" && Boolean(codexData);

    const openRouterPie = openRouterData ? (
        <OpenRouterBudgetPieCard data={openRouterData} />
    ) : openRouterStatus === "error" ? (
        <ErrorCard
            label="OpenRouter Budget Visualization"
            error={openRouterError}
        />
    ) : (
        <LoadingCard label="OpenRouter chart" />
    );

    const copilotPie = copilotData ? (
        <CopilotPremiumPieCard data={copilotData} />
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
        showLowBudgetWarning,
        showOpenRouterRefreshError,
        showCopilotRefreshError,
        showCodexRefreshError,
        openRouterError,
        copilotError,
        codexError,
        openRouterData,
        openRouterPie,
        copilotPie,
        codexPie,
    };
}
