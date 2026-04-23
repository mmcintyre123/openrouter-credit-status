import { Box, SimpleGrid, VStack } from "@chakra-ui/react";
import CardVisibilityDialog from "./components/CardVisibilityDialog.jsx";
import DashboardHeader from "./components/DashboardHeader.jsx";
import SectionAlert from "./components/SectionAlert.jsx";
import { useUsageDashboard } from "./hooks/useUsageDashboard.jsx";

export default function UsageDashboard() {
    const {
        refreshAll,
        isRefreshing,
        cardOptions,
        cardVisibility,
        visibleCardCount,
        showCompactToggle,
        isCardManagerOpen,
        openCardManager,
        closeCardManager,
        setCardVisibility,
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

    const dashboardTitle = `${cardOptions
        .filter(({ key }) => cardVisibility[key])
        .map(({ titleLabel }) => titleLabel)
        .join(" + ")} Usage and Limits`;

    const usageCards = [
        ...(cardVisibility.openrouter
            ? [{ key: "openrouter", content: openRouterPie }]
            : []),
        ...(cardVisibility.copilot
            ? [{ key: "copilot", content: copilotPie }]
            : []),
        {
            key: "codex",
            content: codexPie,
            // Let the Codex card span the full second row until the wide 3-column layout.
            gridColumn:
                visibleCardCount === 3
                    ? { base: "auto", sm: "1 / -1", xl: "auto" }
                    : undefined,
        },
    ].filter(({ key }) => cardVisibility[key] ?? true);

    const gridColumns =
        visibleCardCount === 3
            ? { base: 1, sm: 2, xl: 3 }
            : visibleCardCount === 2
              ? { base: 1, md: 2 }
              : { base: 1 };
    const gridGap =
        visibleCardCount === 3
            ? { base: 3, sm: 2, xl: 3 }
            : visibleCardCount === 2
              ? { base: 3, md: 4 }
              : { base: 3 };
    const gridMaxWidth =
        visibleCardCount === 1
            ? "760px"
            : visibleCardCount === 2
              ? "1200px"
              : "full";

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
                title={dashboardTitle}
                onRefresh={refreshAll}
                loading={isRefreshing}
                onOpenCardManager={openCardManager}
                showCompactToggle={showCompactToggle}
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

                    <Box w="full" mx="auto" maxW={gridMaxWidth}>
                        <SimpleGrid
                            // Rebalance the layout as cards are hidden so the remaining
                            // cards stay centered and intentional at each breakpoint.
                            columns={gridColumns}
                            gap={gridGap}
                            alignItems="stretch"
                        >
                            {usageCards.map(({ key, content, gridColumn }) => (
                                <Box key={key} minW={0} gridColumn={gridColumn}>
                                    {content}
                                </Box>
                            ))}
                        </SimpleGrid>
                    </Box>
                </VStack>
            </Box>

            <CardVisibilityDialog
                isOpen={isCardManagerOpen}
                onOpenChange={(nextOpen) =>
                    nextOpen ? openCardManager() : closeCardManager()
                }
                cardOptions={cardOptions}
                cardVisibility={cardVisibility}
                visibleCardCount={visibleCardCount}
                onSetCardVisibility={setCardVisibility}
            />
        </Box>
    );
}
