import React from "react";
import { Box, Card, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
    formatPercent,
    formatRequestCount,
} from "../../utils/formatters.js";

const COLORS = ["#d69e2e", "#38a169"];

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
    const includedUsed = Number(totals.includedUsed ?? 0);
    const includedRemaining = Number(totals.includedRemaining ?? 0);
    const percentRemaining =
        monthlyLimit > 0 ? (includedRemaining / monthlyLimit) * 100 : 0;

    const chartData = React.useMemo(
        () => [
            {
                name: "Included Requests Used",
                value: includedUsed,
                fill: COLORS[0],
            },
            {
                name: "Included Requests Remaining",
                value: includedRemaining,
                fill: COLORS[1],
            },
        ],
        [includedRemaining, includedUsed],
    );

    return (
        <Card.Root boxShadow="lg" borderWidth="1px" borderColor="gray.200" h="100%">
            <Card.Body p={4}>
                <Heading size="sm" mb={2}>
                    GitHub Copilot Budget Visualization
                </Heading>

                <Box position="relative" display="flex" justifyContent="center" alignItems="center">
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={chartData}
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

                <HStack gap={2} mt={2} justifyContent="center" flexWrap="wrap">
                    {chartData.map((entry, idx) => (
                        <HStack
                            key={entry.name}
                            gap={2}
                            px={3}
                            py={1}
                            borderRadius="md"
                            bg="gray.50"
                            borderWidth="1px"
                            borderColor="gray.200"
                        >
                            <Box
                                w={3}
                                h={3}
                                borderRadius="full"
                                bg={entry.fill ?? COLORS[idx % COLORS.length]}
                            />
                            <VStack gap={0} align="start">
                                <Text fontSize="xs" color="gray.500" fontWeight="600">
                                    {entry.name}
                                </Text>
                                <Text fontSize="sm" fontWeight="bold" color="gray.700">
                                    {formatRequestCount(entry.value)}
                                </Text>
                            </VStack>
                        </HStack>
                    ))}
                </HStack>
            </Card.Body>
        </Card.Root>
    );
}
