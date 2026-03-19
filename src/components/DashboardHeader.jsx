import { Box, Button, Heading, HStack } from "@chakra-ui/react";

export default function DashboardHeader({ onRefresh, loading, isCompact, onToggleCompact }) {
    return (
        <Box
            bgGradient="to-r"
            gradientFrom="teal.500"
            gradientTo="blue.600"
            color="white"
            py={3}
            px={{ base: 4, xl: 6 }}
            boxShadow="md"
            flexShrink={0}
        >
            <HStack justify="space-between" align="center">
                <Heading size={{ base: "md", xl: "lg" }} fontWeight="bold">
                    OpenRouter + Copilot + Codex Usage and Limits
                </Heading>
                <HStack gap={2}>
                    <Button
                        onClick={onToggleCompact}
                        colorPalette="whiteAlpha"
                        size="sm"
                        variant="outline"
                        aria-label={
                            isCompact
                                ? "Expand OpenRouter and Copilot cards"
                                : "Compact OpenRouter and Copilot cards"
                        }
                        borderColor="whiteAlpha.500"
                        color="white"
                        bg={isCompact ? "whiteAlpha.300" : "transparent"}
                        _hover={{ bg: "whiteAlpha.400" }}
                    >
                        {isCompact ? "Expand Cards" : "Compact Cards"}
                    </Button>
                    <Button
                        onClick={onRefresh}
                        loading={loading}
                        colorPalette="whiteAlpha"
                        size="sm"
                        variant="solid"
                        aria-label="Refresh dashboard data"
                        bg="whiteAlpha.300"
                        _hover={{ bg: "whiteAlpha.400" }}
                    >
                        Refresh
                    </Button>
                </HStack>
            </HStack>
        </Box>
    );
}
