import { Box, Button, Heading, HStack } from "@chakra-ui/react";

export default function DashboardHeader({ onRefresh, loading }) {
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
        </Box>
    );
}
