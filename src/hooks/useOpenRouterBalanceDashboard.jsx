/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { Card, HStack, Spinner, Text } from "@chakra-ui/react";
import SectionAlert from "../components/SectionAlert.jsx";
import CopilotPremiumPieCard from "../components/copilot/CopilotPremiumPieCard.jsx";
import CopilotSummaryCard from "../components/copilot/CopilotSummaryCard.jsx";
import OpenRouterBudgetPieCard from "../components/openrouter/OpenRouterBudgetPieCard.jsx";
import OpenRouterSummaryCard from "../components/openrouter/OpenRouterSummaryCard.jsx";
import OpenRouterUsageBreakdownCard from "../components/openrouter/OpenRouterUsageBreakdownCard.jsx";
import { useCopilotPremiumUsage } from "./useCopilotPremiumUsage.js";
import { useOpenRouterBalance } from "./useOpenRouterBalance.js";

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

export function useOpenRouterBalanceDashboard() {
    const {
        data: openRouterData,
        status: openRouterStatus,
        error: openRouterError,
        refresh: refreshOpenRouter,
    } = useOpenRouterBalance();
    const {
        data: copilotData,
        status: copilotStatus,
        error: copilotError,
        refresh: refreshCopilot,
    } = useCopilotPremiumUsage();

    const refreshAll = React.useCallback(async () => {
        await Promise.allSettled([refreshOpenRouter(), refreshCopilot()]);
    }, [refreshCopilot, refreshOpenRouter]);

    React.useEffect(() => {
        refreshAll();
        const id = window.setInterval(refreshAll, 60_000);
        return () => window.clearInterval(id);
    }, [refreshAll]);

    const isRefreshing =
        openRouterStatus === "loading" || copilotStatus === "loading";
    const openRouterPercent = Number(openRouterData?.percentRemaining ?? 0);
    const showLowBudgetWarning =
        Boolean(openRouterData?.warningLowBudget) || openRouterPercent < 10;
    const showOpenRouterRefreshError =
        openRouterStatus === "error" && Boolean(openRouterData);
    const showCopilotRefreshError =
        copilotStatus === "error" && Boolean(copilotData);

    const openRouterSummary = openRouterData ? (
        <OpenRouterSummaryCard data={openRouterData} />
    ) : openRouterStatus === "error" ? (
        <ErrorCard label="OpenRouter Summary" error={openRouterError} />
    ) : (
        <LoadingCard label="OpenRouter summary" />
    );

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

    const openRouterUsage = openRouterData ? (
        <OpenRouterUsageBreakdownCard data={openRouterData} />
    ) : openRouterStatus === "error" ? (
        <ErrorCard label="OpenRouter Usage Breakdown" error={openRouterError} />
    ) : (
        <LoadingCard label="OpenRouter usage" />
    );

    const copilotSummary = copilotData ? (
        <CopilotSummaryCard data={copilotData} />
    ) : copilotStatus === "error" ? (
        <ErrorCard label="Copilot Premium Usage" error={copilotError} />
    ) : (
        <LoadingCard label="Copilot summary" />
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

    return {
        refreshAll,
        isRefreshing,
        showLowBudgetWarning,
        showOpenRouterRefreshError,
        showCopilotRefreshError,
        openRouterError,
        copilotError,
        openRouterData,
        openRouterSummary,
        openRouterPie,
        openRouterUsage,
        copilotSummary,
        copilotPie,
    };
}
