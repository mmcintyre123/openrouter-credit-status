import React from "react";
import { Box, Card, Code, Heading, HStack, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
    formatLocalDateTime,
    formatUSD,
    formatPercent,
    formatRequestCount,
} from "../../utils/formatters.js";

const COLORS = ["#3182ce", "#38a169"];

function CopilotTooltip({ active, payload }) {
    if (!active || !payload || !payload.length) return null;

    return (
        <Box bg="gray.800" color="white" p={3} borderRadius="md" fontSize="sm" boxShadow="lg">
            {payload.map((item) => (
                <Text key={item.name} fontWeight="semibold">
                    {item.name}: {formatRequestCount(item.value)}
                </Text>
            ))}
        </Box>
    );
}

export default function CopilotPremiumPieCard({ data }) {
    const monthlyLimit = Number(data?.plan?.monthlyLimit ?? 300);
    const totals = data?.totals ?? {};
    const billedAmountFallback = Array.isArray(data?.usageItems)
        ? data.usageItems.reduce((sum, item) => sum + Number(item?.netAmount ?? 0), 0)
        : 0;
    const billedAmount = Number(totals.billedAmount ?? billedAmountFallback);
    const chartData = React.useMemo(
        () => [
            {
                name: "Included Requests Used",
                value: Number(totals.includedUsed ?? 0),
                fill: COLORS[0],
                bg: "gray.50",
                border: "gray.200",
                labelColor: "gray.500",
                valueColor: "gray.700",
                format: "count",
                pie: true,
            },
            {
                name: "Included Requests Remaining",
                value: Number(totals.includedRemaining ?? 0),
                fill: COLORS[1],
                bg: "gray.50",
                border: "gray.200",
                labelColor: "gray.500",
                valueColor: "gray.700",
                format: "count",
                pie: true,
            },
            {
                name: "Billed Overage",
                value: Number(totals.netOverage ?? 0),
                fill: "#d69e2e",
                showDot: false,
                bg: "orange.50",
                border: "orange.200",
                labelColor: "orange.700",
                valueColor: "orange.900",
                format: "count",
                pie: false,
            },
            {
                name: "Billed Amount",
                value: billedAmount,
                fill: "#e53e3e",
                showDot: false,
                bg: "red.50",
                border: "red.200",
                labelColor: "red.700",
                valueColor: "red.900",
                format: "currency",
                pie: false,
            },
        ],
        [billedAmount, totals.includedRemaining, totals.includedUsed, totals.netOverage],
    );
    const pieData = chartData.filter((entry) => entry.pie);
    const includedRemaining = Number(pieData[1]?.value ?? 0);
    const percentRemaining =
        monthlyLimit > 0 ? (includedRemaining / monthlyLimit) * 100 : 0;

    return (
        <Card.Root boxShadow="lg" borderWidth="1px" borderColor="gray.200" h="100%">
            <Card.Body p={4}>
                <Heading size="md" mb={2}>
                    GitHub Copilot Pro Budget Visualization
                </Heading>
                <Text fontSize="xs" color="gray.500" mb={2}>
                    Reset: monthly
                </Text>
                <Text fontSize="xs" color="gray.500" mb={2}>
                    Last updated: <Code fontSize="xs">{formatLocalDateTime(data?.fetchedAt)}</Code>
                </Text>

                <Box position="relative" display="flex" justifyContent="center" alignItems="center">
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={65}
                                outerRadius={95}
                                label={false}
                                paddingAngle={4}
                            />
                            <Tooltip content={<CopilotTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>

                    <Box
                        position="absolute"
                        top="50%"
                        left="50%"
                        transform="translate(-50%, -50%)"
                        textAlign="center"
                        pointerEvents="none"
                    >
                        <Text fontSize={{ base: "2xl", xl: "3xl" }} fontWeight="900" color="gray.700" lineHeight="1">
                            {formatPercent(percentRemaining)}
                        </Text>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                            Remaining: {formatRequestCount(includedRemaining)} /{" "}
                            {formatRequestCount(monthlyLimit)}
                        </Text>
                    </Box>
                </Box>

                <SimpleGrid columns={2} gap={2} mt={2} maxW="423px" mx="auto">
                    {chartData.map((item) => (
                        <HStack
                            key={item.name}
                            gap={2}
                            px={3}
                            py={1}
                            minH="56px"
                            w="100%"
                            borderRadius="md"
                            bg={item.bg}
                            borderWidth="1px"
                            borderColor={item.border}
                        >
                            {item.showDot !== false && (
                                <Box w={3} h={3} borderRadius="full" bg={item.fill} />
                            )}
                            <VStack gap={0} align="start">
                                <Text fontSize="xs" color={item.labelColor} fontWeight="600">
                                    {item.name}
                                </Text>
                                <Text fontSize="sm" fontWeight="bold" color={item.valueColor}>
                                    {item.format === "currency"
                                        ? formatUSD(item.value)
                                        : formatRequestCount(item.value)}
                                </Text>
                            </VStack>
                        </HStack>
                    ))}
                </SimpleGrid>
            </Card.Body>
        </Card.Root>
    );
}
