import { Box, Card, Code, Heading, Stat, Text, VStack } from "@chakra-ui/react";
import {
    formatLocalDateTime,
    formatPercent,
    formatUSD,
} from "../../utils/formatters.js";

export default function OpenRouterSummaryCard({ data }) {
    const percent = Number(data?.percentRemaining ?? 0);

    return (
        <Card.Root boxShadow="lg" borderWidth="1px" borderColor="gray.200" h="100%">
            <Card.Body p={4}>
                <Heading size="sm" mb={3}>
                    OpenRouter Budget Summary
                </Heading>

                <VStack gap={3} align="stretch">
                    <Box
                        bg="blue.50"
                        p={3}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="blue.200"
                    >
                        <Stat.Root>
                            <Stat.Label fontSize="xs" color="blue.700" fontWeight="600">
                                Total Limit
                            </Stat.Label>
                            <Stat.ValueText
                                fontSize={{ base: "2xl", xl: "3xl" }}
                                fontWeight="800"
                                color="blue.900"
                            >
                                {formatUSD(data?.totalLimit)}
                            </Stat.ValueText>
                            <Stat.HelpText color="blue.600" fontSize="xs">
                                Reset: {String(data?.resetPeriod || "N/A")}
                            </Stat.HelpText>
                        </Stat.Root>
                    </Box>

                    <Box
                        bg="green.50"
                        p={3}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="green.200"
                    >
                        <Stat.Root>
                            <Stat.Label fontSize="xs" color="green.700" fontWeight="600">
                                Remaining Credit
                            </Stat.Label>
                            <Stat.ValueText
                                fontSize={{ base: "2xl", xl: "3xl" }}
                                fontWeight="800"
                                color="green.900"
                            >
                                {formatUSD(data?.remaining)}
                            </Stat.ValueText>
                        </Stat.Root>
                    </Box>

                    <Box
                        bg="purple.50"
                        p={3}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="purple.200"
                    >
                        <Stat.Root>
                            <Stat.Label fontSize="xs" color="purple.700" fontWeight="600">
                                Total Usage
                            </Stat.Label>
                            <Stat.ValueText
                                fontSize={{ base: "2xl", xl: "3xl" }}
                                fontWeight="800"
                                color="purple.900"
                            >
                                {formatUSD(data?.usage)}
                            </Stat.ValueText>
                        </Stat.Root>
                    </Box>

                    <Text fontSize="xs" color="gray.500" textAlign="center">
                        Last updated: <Code fontSize="xs">{formatLocalDateTime(data?.fetchedAt)}</Code>
                    </Text>
                </VStack>
            </Card.Body>
        </Card.Root>
    );
}
