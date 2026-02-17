import { Box, SimpleGrid, VStack } from "@chakra-ui/react";
import DashboardHeader from "./components/DashboardHeader.jsx";
import SectionAlert from "./components/SectionAlert.jsx";
import { useOpenRouterBalanceDashboard } from "./hooks/useOpenRouterBalanceDashboard.jsx";

export default function OpenRouterBalanceDashboard() {
    const {
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
        openRouterSummary,
        openRouterPie,
        openRouterUsage,
        copilotSummary,
        copilotPie,
        codexPie,
    } = useOpenRouterBalanceDashboard();

    return (
        <Box
            bg="gray.50"
            minH="100vh"
            h={{ base: "auto", xl: "100vh" }}
            overflow={{ base: "visible", xl: "hidden" }}
            display="flex"
            flexDirection="column"
        >
            <DashboardHeader onRefresh={refreshAll} loading={isRefreshing} />

            <Box
                flex="1"
                px={{ base: 4, xl: 6 }}
                py={{ base: 4, xl: 3 }}
                overflow={{ base: "visible", xl: "hidden" }}
            >
                <VStack align="stretch" gap={3} h="full">
                    {showLowBudgetWarning && openRouterData && (
                        <SectionAlert
                            status="warning"
                            message="Warning: you have less than 10% of your OpenRouter budget left."
                        />
                    )}
                    {showOpenRouterRefreshError && (
                        <SectionAlert
                            status="error"
                            message={`OpenRouter refresh failed: ${openRouterError}`}
                        />
                    )}
                    {showCopilotRefreshError && (
                        <SectionAlert
                            status="error"
                            message={`Copilot refresh failed: ${copilotError}`}
                        />
                    )}
                    {showCodexRefreshError && (
                        <SectionAlert
                            status="error"
                            message={`Codex refresh failed: ${codexError}`}
                        />
                    )}

                    <SimpleGrid columns={{ base: 1, xl: 3 }} gap={3}>
                        {openRouterSummary}
                        {openRouterUsage}
                        {copilotSummary}
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, xl: 3 }} gap={3} flex="1">
                        {openRouterPie}
                        {copilotPie}
                        {codexPie}
                    </SimpleGrid>
                </VStack>
            </Box>
        </Box>
    );
}
