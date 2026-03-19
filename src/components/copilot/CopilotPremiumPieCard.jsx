import React from "react";
import {
    Box,
    Card,
    Code,
    Heading,
    HStack,
    SimpleGrid,
    Text,
    VStack,
} from "@chakra-ui/react";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import CompactCardToggle from "../CompactCardToggle.jsx";
import {
    formatLocalDateTime,
    formatUSD,
    formatPercent,
    formatRequestCount,
} from "../../utils/formatters.js";

const COLORS = ["#3182ce", "#38a169"];
const DETAILS_TRANSITION = "max-height 0.18s ease, opacity 0.16s ease, transform 0.18s ease";
const CARD_TITLE = "GitHub Copilot Pro Budget Visualization";

function CopilotTooltip({ active, payload }) {
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
                    {item.name}: {formatRequestCount(item.value)}
                </Text>
            ))}
        </Box>
    );
}

export default function CopilotPremiumPieCard({ data, isCompact = false, onToggleCompact }) {
    const idPrefix = React.useId().replace(/:/g, "");
    const headingId = `${idPrefix}-heading`;
    const detailsId = `${idPrefix}-details`;
    const monthlyLimit = Number(data?.plan?.monthlyLimit ?? 300);
    const totals = data?.totals ?? {};
    const billedAmountFallback = Array.isArray(data?.usageItems)
        ? data.usageItems.reduce(
              (sum, item) => sum + Number(item?.netAmount ?? 0),
              0,
          )
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
                bg: "gray.50",
                border: "gray.200",
                labelColor: "gray.500",
                valueColor: "orange.900",
                format: "count",
                pie: false,
            },
            {
                name: "Billed Amount",
                value: billedAmount,
                fill: "#e53e3e",
                showDot: false,
                bg: "gray.50",
                border: "gray.200",
                labelColor: "gray.500",
                valueColor: "red.900",
                format: "currency",
                pie: false,
            },
        ],
        [
            billedAmount,
            totals.includedRemaining,
            totals.includedUsed,
            totals.netOverage,
        ],
    );
    const pieData = chartData.filter((entry) => entry.pie);
    const includedRemaining = Number(pieData[1]?.value ?? 0);
    const percentRemaining =
        monthlyLimit > 0 ? (includedRemaining / monthlyLimit) * 100 : 0;

    return (
        <Card.Root
            boxShadow="lg"
            borderWidth="1px"
            borderColor="gray.200"
            h="100%"
        >
            <Card.Body p={isCompact ? 3 : 4}>
                <HStack justify="space-between" align="flex-start" mb={2}>
                    <Heading id={headingId} size="md">
                        {CARD_TITLE}
                    </Heading>
                    <CompactCardToggle
                        isCompact={isCompact}
                        title={CARD_TITLE}
                        controlsId={detailsId}
                        onToggle={onToggleCompact}
                    />
                </HStack>
                <Text fontSize="xs" color="gray.500" mb={2}>
                    Reset: monthly
                </Text>
                <Text fontSize="xs" color="gray.500" mb={isCompact ? -1 : -3}>
                    Last updated:{" "}
                    <Code fontSize="xs">
                        {formatLocalDateTime(data?.fetchedAt)}
                    </Code>
                </Text>

                <Box
                    position="relative"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    transition="padding 0.18s ease"
                    pt={isCompact ? 1 : 0}
                    pb={isCompact ? 0 : 1}
                >
                    <ResponsiveContainer width="100%" height={isCompact ? 228 : 250}>
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
                        <Text
                            fontSize={{ base: "2xl", xl: "3xl" }}
                            fontWeight="900"
                            color="gray.700"
                            lineHeight="1"
                        >
                            {formatPercent(percentRemaining)}
                        </Text>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                            Remaining:<br/>{formatRequestCount(includedRemaining)} /{" "}
                            {formatRequestCount(monthlyLimit)}
                        </Text>
                    </Box>
                </Box>

                <Box
                    id={detailsId}
                    role="region"
                    aria-labelledby={headingId}
                    aria-hidden={isCompact}
                    overflow="hidden"
                    maxHeight={isCompact ? "0px" : "320px"}
                    opacity={isCompact ? 0 : 1}
                    transform={isCompact ? "translateY(-6px)" : "translateY(0)"}
                    pointerEvents={isCompact ? "none" : "auto"}
                    style={{ transition: DETAILS_TRANSITION }}
                >
                    <SimpleGrid columns={2} gap={2} mt={0} maxW="423px" mx="auto">
                        {chartData.map((item) => (
                            <HStack
                                key={item.name}
                                gap={2}
                                px={3}
                                py={1}
                                minH="45px"
                                w="100%"
                                borderRadius="md"
                                bg={item.bg}
                                borderWidth="1px"
                                borderColor={item.border}
                            >
                                {item.showDot !== false && (
                                    <Box
                                        w={3}
                                        h={3}
                                        borderRadius="full"
                                        bg={item.fill}
                                    />
                                )}
                                <VStack gap={0} align="start">
                                    <Text
                                        fontSize="xs"
                                        color={item.labelColor}
                                        fontWeight="600"
                                    >
                                        {item.name}
                                    </Text>
                                    <Text
                                        fontSize="sm"
                                        fontWeight="bold"
                                        color={item.valueColor}
                                    >
                                        {item.format === "currency"
                                            ? formatUSD(item.value)
                                            : formatRequestCount(item.value)}
                                    </Text>
                                </VStack>
                            </HStack>
                        ))}
                    </SimpleGrid>
                </Box>
            </Card.Body>
        </Card.Root>
    );
}
