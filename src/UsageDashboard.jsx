import { Box, SimpleGrid, VStack } from "@chakra-ui/react";
import DashboardHeader from "./components/DashboardHeader.jsx";
import SectionAlert from "./components/SectionAlert.jsx";
import { useUsageDashboard } from "./hooks/useUsageDashboard.jsx";

export default function UsageDashboard() {
    const {
        refreshAll,
        isRefreshing,
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
    } = useUsageDashboard();

    return (
        <Box
            bg="gray.50"
            minH="100vh"
            h={{ base: "auto", xl: "100vh" }}
            overflow={{ base: "visible", xl: "hidden" }}
            display="flex"
            flexDirection="column"
        >
            <DashboardHeader
                onRefresh={refreshAll}
                loading={isRefreshing}
                isCompact={isGlobalCompact}
                onToggleCompact={toggleGlobalCompact}
            />

            <Box
                flex="1"
                px={{ base: 4, xl: 6 }}
                py={{ base: 4, xl: 3 }}
                overflow={{ base: "visible", xl: "hidden" }}
            >
                <VStack align="stretch" gap={3} h="full">
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

                    <SimpleGrid
                        columns={{ base: 1, md: 2, xl: 3 }}
                        gap={{ base: 3, md: 2, xl: 3 }}
                        alignItems="stretch"
                    >
                        <Box minW={0}>{openRouterPie}</Box>
                        <Box minW={0}>{copilotPie}</Box>
                        <Box
                            minW={0}
                            gridColumn={{ base: "auto", md: "1 / -1", xl: "auto" }}
                        >
                            {codexPie}
                        </Box>
                    </SimpleGrid>
                </VStack>
            </Box>
        </Box>
    );
}
