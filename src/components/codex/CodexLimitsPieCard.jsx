import React from "react";
import {
    Code,
    Box,
    Card,
    Heading,
    HStack,
    Separator,
    SimpleGrid,
    Text,
} from "@chakra-ui/react";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
    formatLocalDateTime,
    formatLocalDateTimeWithZone,
    formatPercent,
    formatUSD,
} from "../../utils/formatters.js";
import { useRechartsTooltipDismissal } from "../../hooks/useRechartsTooltipDismissal.js";

const COLORS = ["#2b6cb0", "#48bb78"];
const CHATGPT_CREDIT_USD_RATE = 0.04;

function formatWindowLabel(windowData) {
    const windowSeconds = Number(windowData?.windowSeconds);

    if (windowSeconds === 7 * 24 * 60 * 60) return "7-Day Limit";
    if (windowSeconds === 5 * 60 * 60) return "5-Hour Limit";

    return "Usage Limit";
}

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
    const {
        chartSurfaceProps,
        tooltipInstanceKey,
        tooltipProps,
    } = useRechartsTooltipDismissal({ enabled: Boolean(windowData) });

    if (!windowData) {
        return (
            <Box
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="md"
                p={{ base: 3, md: 2.5, xl: 3 }}
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
        { name: "Used", value: usedPercent, fill: COLORS[0] },
        { name: "Remaining", value: remainingPercent, fill: COLORS[1] },
    ];

    return (
        <Box
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="md"
            p={{ base: 3, md: 2.5, xl: 3 }}
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
                h={{ base: "180px", md: "164px", xl: "180px" }}
                {...chartSurfaceProps}
            >
                <ResponsiveContainer width="100%" height="100%">
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
                        />
                        <Tooltip
                            key={tooltipInstanceKey}
                            content={<CodexTooltip />}
                            {...tooltipProps}
                        />
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
                        fontSize={{ base: "xl", md: "lg", xl: "2xl" }}
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
                            bg={entry.fill ?? COLORS[idx % COLORS.length]}
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
    const primary = data?.limits?.primary ?? null;
    const secondary = data?.limits?.secondary ?? null;
    const limitWindows = [primary, secondary].filter(Boolean);
    const credits = data?.credits ?? null;
    const rawCreditBalance = Number(credits?.balance ?? 0);
    const balanceUsd = Number(
        credits?.balanceUsd ??
            Math.floor(Math.max(rawCreditBalance, 0)) *
                CHATGPT_CREDIT_USD_RATE,
    );
    const hasCreditBalance =
        credits?.hasCredits && Number.isFinite(balanceUsd);

    return (
        <Card.Root
            boxShadow="lg"
            borderWidth="1px"
            borderColor="gray.200"
            h="100%"
        >
            <Card.Body p={{ base: 4, md: 3, xl: 4 }}>
                <HStack justify="space-between" align="flex-start" gap={3} mb={3}>
                    <Box minW={0}>
                        <Heading size="md">
                            ChatGPT Plus Codex Allowance
                        </Heading>
                        <Text fontSize="xs" color="gray.500" mt={2}>
                            Last updated:{" "}
                            <Code fontSize="xs">
                                {formatLocalDateTime(data?.fetchedAt)}
                            </Code>
                        </Text>
                    </Box>
                    {(hasCreditBalance || credits?.unlimited) && (
                        <Box
                            flexShrink={0}
                            px={3}
                            py={1.5}
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor="blue.200"
                            bg="blue.50"
                            textAlign="right"
                        >
                            <Text
                                fontSize="2xs"
                                color="blue.700"
                                fontWeight="700"
                                textTransform="uppercase"
                                letterSpacing="wide"
                            >
                                Credit Balance
                            </Text>
                            <Text
                                fontSize="lg"
                                color="blue.700"
                                fontWeight="900"
                                lineHeight="1.15"
                            >
                                {credits?.unlimited
                                    ? "Unlimited"
                                    : formatUSD(balanceUsd)}
                            </Text>
                        </Box>
                    )}
                </HStack>

                <SimpleGrid
                    columns={{ base: 1, sm: limitWindows.length > 1 ? 2 : 1 }}
                    gap={{ base: 3, sm: 2, xl: 3 }}
                >
                    {limitWindows.map((windowData, index) => (
                        <WindowPie
                            key={`${windowData.windowSeconds ?? "unknown"}-${index}`}
                            windowLabel={formatWindowLabel(windowData)}
                            windowData={windowData}
                        />
                    ))}
                </SimpleGrid>
            </Card.Body>
        </Card.Root>
    );
}
