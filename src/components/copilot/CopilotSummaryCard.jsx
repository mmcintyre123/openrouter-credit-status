import { Box, Card, Code, Heading, SimpleGrid, Stat, Text, VStack } from "@chakra-ui/react";
import {
    formatUSD,
    formatLocalDateTime,
    formatMonthYear,
    formatRequestCount,
} from "../../utils/formatters.js";

const KPI_ITEMS = [
    {
        key: "includedUsed",
        label: "Included Used",
        bg: "blue.50",
        border: "blue.200",
        text: "blue.700",
        value: "blue.900",
        format: "count",
    },
    {
        key: "includedRemaining",
        label: "Included Remaining",
        bg: "green.50",
        border: "green.200",
        text: "green.700",
        value: "green.900",
        format: "count",
    },
    {
        key: "planIncludedLimit",
        label: "Plan Included Limit",
        bg: "teal.50",
        border: "teal.200",
        text: "teal.700",
        value: "teal.900",
        format: "count",
    },
    {
        key: "grossUsed",
        label: "Gross Premium Requests",
        bg: "purple.50",
        border: "purple.200",
        text: "purple.700",
        value: "purple.900",
        format: "count",
    },
    {
        key: "netOverage",
        label: "Billed Overage",
        bg: "orange.50",
        border: "orange.200",
        text: "orange.700",
        value: "orange.900",
        format: "count",
    },
    {
        key: "billedAmount",
        label: "Billed Amount",
        bg: "red.50",
        border: "red.200",
        text: "red.700",
        value: "red.900",
        format: "currency",
    },
];

export default function CopilotSummaryCard({ data }) {
    const monthlyLimit = Number(data?.plan?.monthlyLimit ?? 300);
    const totals = data?.totals ?? {};
    const billedAmount = Number(
        totals.billedAmount ??
            (Array.isArray(data?.usageItems)
                ? data.usageItems.reduce(
                      (sum, item) => sum + Number(item?.netAmount ?? 0),
                      0,
                  )
                : 0),
    );
    const kpiValues = {
        includedUsed: totals.includedUsed,
        planIncludedLimit: monthlyLimit,
        includedRemaining: totals.includedRemaining,
        grossUsed: totals.grossUsed,
        netOverage: totals.netOverage,
        billedAmount,
    };

    return (
        <Card.Root boxShadow="lg" borderWidth="1px" borderColor="gray.200" h="100%">
            <Card.Body p={4}>
                <VStack align="stretch" gap={2}>
                    <Heading size="sm">Copilot Premium Usage Breakdown</Heading>
                    <Text fontSize="xs" color="gray.500">
                        Period: <Code fontSize="xs">{formatMonthYear(data?.timePeriod)}</Code>
                    </Text>

                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
                        {KPI_ITEMS.map((item) => (
                            <Box
                                key={item.key}
                                bg={item.bg}
                                p={2}
                                borderRadius="md"
                                borderWidth="1px"
                                borderColor={item.border}
                            >
                                <Stat.Root>
                                    <Stat.Label fontSize="xs" color={item.text} fontWeight="600">
                                        {item.label}
                                    </Stat.Label>
                                    <Stat.ValueText fontSize="lg" fontWeight="800" color={item.value}>
                                        {item.format === "currency"
                                            ? formatUSD(kpiValues[item.key])
                                            : formatRequestCount(kpiValues[item.key])}
                                    </Stat.ValueText>
                                </Stat.Root>
                            </Box>
                        ))}
                    </SimpleGrid>

                    <Text fontSize="xs" color="gray.500" textAlign="center">
                        Last updated: <Code fontSize="xs">{formatLocalDateTime(data?.fetchedAt)}</Code>
                    </Text>
                </VStack>
            </Card.Body>
        </Card.Root>
    );
}
