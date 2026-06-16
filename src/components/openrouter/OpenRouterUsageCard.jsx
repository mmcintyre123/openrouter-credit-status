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
import React from "react";
import {
    formatLocalDateTime,
    formatUSD,
} from "../../utils/formatters.js";
import CompactCardToggle from "../CompactCardToggle.jsx";

const DETAILS_TRANSITION =
    "max-height 0.18s ease, opacity 0.16s ease, transform 0.18s ease";
const CARD_TITLE = "OpenRouter Usage";

function UsagePeriod({ label, value, description }) {
    return (
        <VStack
            gap={0}
            align="start"
            px={3}
            py={2}
            borderRadius="md"
            bg="gray.50"
            borderWidth="1px"
            borderColor="gray.200"
        >
            <Text fontSize="xs" color="gray.500" fontWeight="600">
                {label}
            </Text>
            <Text fontSize="lg" fontWeight="bold" color="gray.700">
                {formatUSD(value)}
            </Text>
            <Text fontSize="2xs" color="gray.500">
                {description}
            </Text>
        </VStack>
    );
}

export default function OpenRouterUsageCard({
    data,
    isCompact = false,
    onToggleCompact,
}) {
    const idPrefix = React.useId().replace(/:/g, "");
    const headingId = `${idPrefix}-heading`;
    const detailsId = `${idPrefix}-details`;
    // Fallbacks keep the card useful while an already-running backend reloads.
    const usageToday = Number(
        data?.usageToday ?? data?.providerDailyUsage ?? 0,
    );
    const usageThisWeek = Number(
        data?.usageThisWeek ?? data?.usageWeekly ?? 0,
    );
    const usageThisMonth = Number(
        data?.usageThisMonth ?? data?.usageMonthly ?? 0,
    );
    const usageAllTime = Number(data?.usageAllTime ?? data?.usage ?? 0);
    const usageTimezone = data?.usageTimezone || "UTC";
    const keyLabel = data?.keyLabel;

    return (
        <Card.Root
            boxShadow="lg"
            borderWidth="1px"
            borderColor="gray.200"
            h="100%"
        >
            <Card.Body p={4}>
                <HStack justify="space-between" align="flex-start">
                    <Box>
                        <Heading id={headingId} size="md">
                            {CARD_TITLE}
                        </Heading>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                            Pay-as-you-go spend
                            {/* {keyLabel ? ` for ${keyLabel}` : ""} */}
                        </Text>
                    </Box>
                    <CompactCardToggle
                        isCompact={isCompact}
                        title={CARD_TITLE}
                        controlsId={detailsId}
                        onToggle={onToggleCompact}
                    />
                </HStack>

                <Box
                    mt={3}
                    py={5}
                    px={4}
                    textAlign="center"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="blue.200"
                    bg="blue.50"
                >
                    <Text
                        fontSize="xs"
                        color="blue.700"
                        fontWeight="700"
                        textTransform="uppercase"
                        letterSpacing="wide"
                    >
                        Today ({usageTimezone})
                    </Text>
                    <Text
                        mt={1}
                        fontSize={{ base: "4xl", xl: "5xl" }}
                        fontWeight="900"
                        color="blue.700"
                        lineHeight="1"
                    >
                        {formatUSD(usageToday)}
                    </Text>
                    <Text fontSize="xs" color="blue.600" mt={2}>
                        Total usage in the current UTC day
                    </Text>
                </Box>

                <Text fontSize="xs" color="gray.500" mt={2} textAlign="center">
                    Last updated:{" "}
                    <Code fontSize="xs">
                        {formatLocalDateTime(data?.fetchedAt)}
                    </Code>
                </Text>

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
                    <SimpleGrid columns={{ base: 1, sm: 3 }} gap={2} mt={3}>
                        <UsagePeriod
                            label="This Week"
                            value={usageThisWeek}
                            description="Since Monday (UTC)"
                        />
                        <UsagePeriod
                            label="This Month"
                            value={usageThisMonth}
                            description="Current UTC month"
                        />
                        <UsagePeriod
                            label="All-Time"
                            value={usageAllTime}
                            description="Lifetime key usage"
                        />
                    </SimpleGrid>
                </Box>
            </Card.Body>
        </Card.Root>
    );
}
