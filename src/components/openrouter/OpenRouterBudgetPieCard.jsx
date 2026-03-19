import {
    Box,
    Card,
    Code,
    Heading,
    HStack,
    Text,
    VStack,
} from "@chakra-ui/react";
import React from "react";
import {
    Pie,
    PieChart,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
} from "recharts";
import {
    formatLocalDateTime,
    formatPercent,
    formatUSD,
} from "../../utils/formatters.js";
import CompactCardToggle from "../CompactCardToggle.jsx";
import { InfoTooltip, PieTooltip } from "../PieTooltip.jsx";

const COLORS = ["#38a169", "#3182ce"];
const DETAILS_TRANSITION = "max-height 0.18s ease, opacity 0.16s ease, transform 0.18s ease";
const CARD_TITLE = "OpenRouter Budget Visualization";

export default function OpenRouterBudgetPieCard({ data, isCompact = false, onToggleCompact }) {
    const idPrefix = React.useId().replace(/:/g, "");
    const headingId = `${idPrefix}-heading`;
    const detailsId = `${idPrefix}-details`;
    const percent = Number(data?.percentRemaining ?? 0);
    const totalLimit = Number(data?.totalLimit ?? 0);
    const remaining = Number(data?.remaining ?? 0);
    const budgetUsed = Number(data?.budgetUsed ?? 0);
    const providerDailyUsage = Number(data?.providerDailyUsage ?? 0);
    const sessionUsage = Number(data?.sessionUsage ?? 0);
    const allTimeUsage = Number(data?.usage ?? 0);
    const pieData = React.useMemo(
        () => [
            {
                name: "Used (Current Budget)",
                value: budgetUsed,
                fill: COLORS[1],
            },
            { name: "Total Remaining", value: remaining, fill: COLORS[0] },
        ],
        [budgetUsed, remaining],
    );

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
                    Reset: {String(data?.resetPeriod || "N/A")}
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
                            <RechartsTooltip content={<PieTooltip />} />
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
                            {formatPercent(percent)}
                        </Text>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                            Remaining
                        </Text>
                    </Box>
                </Box>

                <Box
                    id={detailsId}
                    role="region"
                    aria-labelledby={headingId}
                    aria-hidden={isCompact}
                    overflow="hidden"
                    maxHeight={isCompact ? "0px" : "800px"}
                    opacity={isCompact ? 0 : 1}
                    transform={isCompact ? "translateY(-6px)" : "translateY(0)"}
                    pointerEvents={isCompact ? "none" : "auto"}
                    style={{ transition: DETAILS_TRANSITION }}
                >
                    <HStack gap={2} mt={0} justifyContent="center" flexWrap="wrap">
                    {pieData.map((entry) => (
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
                                bg={entry.fill}
                            />
                            <VStack gap={0} align="start">
                                <Text
                                    fontSize="xs"
                                    color="gray.500"
                                    fontWeight="600"
                                >
                                    {entry.name}
                                </Text>
                                <Text
                                    fontSize="sm"
                                    fontWeight="bold"
                                    color="gray.700"
                                >
                                    {formatUSD(entry.value)}
                                </Text>
                            </VStack>
                        </HStack>
                    ))}
                    <HStack
                        gap={2}
                        px={3}
                        py={1}
                        borderRadius="md"
                        bg="gray.50"
                        borderWidth="1px"
                        borderColor="gray.200"
                    >
                        <VStack gap={0} align="start">
                            <Text
                                fontSize="xs"
                                color="gray.500"
                                fontWeight="600"
                            >
                                Total Limit
                            </Text>
                            <Text
                                fontSize="sm"
                                fontWeight="bold"
                                color="gray.700"
                            >
                                {formatUSD(totalLimit)}
                            </Text>
                        </VStack>
                    </HStack>
                    <HStack
                        gap={2}
                        px={3}
                        py={1}
                        borderRadius="md"
                        bg="gray.50"
                        borderWidth="1px"
                        borderColor="gray.200"
                    >
                        <Box w={3} h={3} borderRadius="full" bg="#3182ce" />
                        <VStack gap={0} align="start">
                            <InfoTooltip>Provider Daily Usage</InfoTooltip>
                            <Text
                                fontSize="sm"
                                fontWeight="bold"
                                color="gray.700"
                            >
                                {formatUSD(providerDailyUsage)}
                            </Text>
                        </VStack>
                    </HStack>
                    <HStack
                        gap={2}
                        px={3}
                        py={1}
                        borderRadius="md"
                        bg="gray.50"
                        borderWidth="1px"
                        borderColor="gray.200"
                    >
                        <Box w={3} h={3} borderRadius="full" bg="#3182ce" />
                        <VStack gap={0} align="start">
                            <Text
                                fontSize="xs"
                                color="gray.500"
                                fontWeight="600"
                            >
                                Session Usage
                            </Text>
                            <Text
                                fontSize="sm"
                                fontWeight="bold"
                                color="gray.700"
                            >
                                {formatUSD(sessionUsage)}
                            </Text>
                        </VStack>
                    </HStack>
                    <HStack
                        gap={2}
                        px={3}
                        py={1}
                        borderRadius="md"
                        bg="gray.50"
                        borderWidth="1px"
                        borderColor="gray.200"
                    >
                        <VStack gap={0} align="start">
                            <Text
                                fontSize="xs"
                                color="gray.500"
                                fontWeight="600"
                            >
                                All-Time Used
                            </Text>
                            <Text
                                fontSize="sm"
                                fontWeight="bold"
                                color="gray.700"
                            >
                                {formatUSD(allTimeUsage)}
                            </Text>
                        </VStack>
                    </HStack>
                    </HStack>
                </Box>
            </Card.Body>
        </Card.Root>
    );
}
