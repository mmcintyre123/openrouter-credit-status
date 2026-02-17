import {
    Box,
    Card,
    Heading,
    Separator,
    SimpleGrid,
    Stat,
} from "@chakra-ui/react";
import { formatUSD } from "../../utils/formatters.js";

const ITEMS = [
    {
        key: "usageDaily",
        label: "Daily",
        bg: "orange.50",
        border: "orange.200",
        text: "orange.700",
        value: "orange.900",
    },
    {
        key: "usageWeekly",
        label: "Weekly",
        bg: "cyan.50",
        border: "cyan.200",
        text: "cyan.700",
        value: "cyan.900",
    },
    {
        key: "usageMonthly",
        label: "Monthly",
        bg: "pink.50",
        border: "pink.200",
        text: "pink.700",
        value: "pink.900",
    },
];

export default function OpenRouterUsageBreakdownCard({ data }) {
    return (
        <Card.Root
            boxShadow="lg"
            borderWidth="1px"
            borderColor="gray.200"
            h="100%"
        >
            <Card.Body p={4}>
                <Heading size="sm" mb={2}>
                    OpenRouter Usage Breakdown
                </Heading>
                <Separator mb={3} />
                <SimpleGrid columns={{ base: 1, sm: 2 }} gap={2}>
                    {ITEMS.map((item) => (
                        <Box
                            key={item.key}
                            bg={item.bg}
                            p={3}
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor={item.border}
                        >
                            <Stat.Root>
                                <Stat.Label
                                    fontSize="xs"
                                    color={item.text}
                                    fontWeight="600"
                                >
                                    {item.label}
                                </Stat.Label>
                                <Stat.ValueText
                                    fontSize="xl"
                                    fontWeight="800"
                                    color={item.value}
                                >
                                    {formatUSD(data?.[item.key])}
                                </Stat.ValueText>
                            </Stat.Root>
                        </Box>
                    ))}
                </SimpleGrid>
            </Card.Body>
        </Card.Root>
    );
}
