import React from "react";
import {
    Box,
    Card,
    Heading,
    HStack,
    Separator,
    SimpleGrid,
    Text,
} from "@chakra-ui/react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
    formatLocalDateTimeWithZone,
    formatPercent,
} from "../../utils/formatters.js";

const COLORS = ["#2b6cb0", "#48bb78"];

function clampPercent(value) {
    const number = Number(value ?? 0);
    return Math.min(Math.max(number, 0), 100);
}

function CodexTooltip({ active, payload }) {
    if (!active || !payload || !payload.length) return null;

    return (
        <Box
            bg="gray.800"
            color="white"
            p={3}
            borderRadius="md"
            fontSize="sm"
            boxShadow="lg"
        >
            {payload.map((item) => (
                <Text key={item.name} fontWeight="semibold">
                    {item.name}: {formatPercent(item.value)}
                </Text>
            ))}
        </Box>
    );
}

function WindowPie({ windowLabel, windowData }) {
    if (!windowData) {
        return (
            <Box
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="md"
                p={3}
                h="100%"
            >
                <Text fontSize="sm" fontWeight="700" color="gray.700" mb={2}>
                    {windowLabel}
                </Text>
                <Text fontSize="sm" color="gray.500">
                    Not available for this plan.
                </Text>
            </Box>
        );
    }

    const usedPercent = clampPercent(windowData.usedPercent);
    const remainingPercent = clampPercent(100 - usedPercent);
    const chartData = [
        { name: "Used", value: usedPercent },
        { name: "Remaining", value: remainingPercent },
    ];

    return (
        <Box
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="md"
            p={3}
            h="100%"
        >
            <Text fontSize="sm" fontWeight="700" color="gray.700" mb={2}>
                {windowLabel}
            </Text>

            <Box
                position="relative"
                display="flex"
                justifyContent="center"
                alignItems="center"
            >
                <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            label={false}
                            paddingAngle={4}
                        >
                            {chartData.map((entry, idx) => (
                                <Cell
                                    key={`${windowLabel}-${entry.name}-${idx}`}
                                    fill={COLORS[idx % COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CodexTooltip />} />
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
                    <Text
                        fontSize={{ base: "xl", xl: "2xl" }}
                        fontWeight="900"
                        color="gray.700"
                        lineHeight="1"
                    >
                        {formatPercent(remainingPercent)}
                    </Text>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                        Remaining
                    </Text>
                </Box>
            </Box>

            <HStack gap={2} justifyContent="center" mb={2}>
                {chartData.map((entry, idx) => (
                    <HStack key={`${windowLabel}-${entry.name}`} gap={1}>
                        <Box
                            w={2}
                            h={2}
                            borderRadius="full"
                            bg={COLORS[idx % COLORS.length]}
                        />
                        <Text fontSize="xs" color="gray.600">
                            {entry.name}: {formatPercent(entry.value)}
                        </Text>
                    </HStack>
                ))}
            </HStack>

            <Text fontSize="xs" color="gray.500" textAlign="center">
                Resets: {formatLocalDateTimeWithZone(windowData.resetAtIso)}
            </Text>
        </Box>
    );
}

export default function CodexLimitsPieCard({ data }) {
    const planType = data?.planType ? String(data.planType).toUpperCase() : "—";
    const primary = data?.limits?.primary ?? null;
    const secondary = data?.limits?.secondary ?? null;

    return (
        <Card.Root
            boxShadow="lg"
            borderWidth="1px"
            borderColor="gray.200"
            h="100%"
        >
            <Card.Body p={4}>
                <Heading size="sm" mb={2}>
                    ChatGPT Codex Allowance
                </Heading>
                <Text fontSize="xs" color="gray.500" mb={2}>
                    Plan: {planType}
                </Text>
                <Separator mb={3} />

                <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                    <WindowPie
                        windowLabel="5-Hour Limit"
                        windowData={primary}
                    />
                    <WindowPie
                        windowLabel="7-Day Limit"
                        windowData={secondary}
                    />
                </SimpleGrid>
            </Card.Body>
        </Card.Root>
    );
}
