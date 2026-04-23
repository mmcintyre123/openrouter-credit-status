import { Box, Button, Heading, HStack } from "@chakra-ui/react";

export default function DashboardHeader({
    title,
    onRefresh,
    loading,
    onOpenCardManager,
    showCompactToggle,
    isCompact,
    onToggleCompact,
}) {
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
                    {title}
                </Heading>
                <HStack gap={2}>
                    {showCompactToggle && (
                        <Button
                            onClick={onToggleCompact}
                            colorPalette="whiteAlpha"
                            size="sm"
                            variant="outline"
                            aria-label={
                                isCompact
                                    ? "Expand usage cards"
                                    : "Compact usage cards"
                            }
                            borderColor="whiteAlpha.500"
                            color="white"
                            bg={isCompact ? "whiteAlpha.300" : "transparent"}
                            _hover={{ bg: "whiteAlpha.400" }}
                        >
                            {isCompact ? "Expand Cards" : "Compact Cards"}
                        </Button>
                    )}
                    <Button
                        onClick={onOpenCardManager}
                        colorPalette="whiteAlpha"
                        size="sm"
                        variant="outline"
                        aria-label="Manage card visibility"
                        borderColor="whiteAlpha.500"
                        color="white"
                        _hover={{ bg: "whiteAlpha.400" }}
                    >
                        Manage Cards
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
