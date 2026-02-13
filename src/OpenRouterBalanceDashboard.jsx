import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import React from "react";
import {
    Box,
    Card,
    Heading,
    HStack,
    VStack,
    Text,
    Stat,
    Progress,
    Alert,
    Button,
    Spinner,
    Separator,
    Code,
    SimpleGrid,
} from "@chakra-ui/react";

function formatUSD(value) {
    const n = Number(value ?? 0);
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatPercent(value) {
    const n = Number(value ?? 0);
    return `${n.toFixed(1)}%`;
}

/**
 * Expected API response shape from your backend:
 * {
 *   "totalLimit": 20.0,
 *   "remaining": 7.32,
 *   "resetPeriod": "monthly",
 *   "usage": 12.68,
 *   "usageDaily": 0.52,
 *   "usageWeekly": 2.14,
 *   "usageMonthly": 12.68,
 *   "percentRemaining": 36.6,
 *   "warningLowBudget": false,
 *   "fetchedAt": "2026-02-12T19:03:00.000Z"
 * }
 */
export default function OpenRouterBalanceDashboard() {
    const [data, setData] = React.useState(null);
    const [status, setStatus] = React.useState("idle"); // idle | loading | ok | error
    const [error, setError] = React.useState("");

    const fetchBalance = React.useCallback(async () => {
        setStatus("loading");
        setError("");

        try {
            const res = await fetch(
                "http://localhost:4000/api/openrouter/balance",
                {
                    method: "GET",
                    headers: { Accept: "application/json" },
                },
            );

            if (!res.ok) {
                const text = await res.text();
                throw new Error(
                    `Request failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`,
                );
            }

            const json = await res.json();
            setData(json);
            setStatus("ok");
        } catch (e) {
            setStatus("error");
            setError(e?.message || "Unknown error");
        }
    }, []);

    React.useEffect(() => {
        fetchBalance();
        const id = window.setInterval(fetchBalance, 60_000); // refresh every 60s
        return () => window.clearInterval(id);
    }, [fetchBalance]);

    const percent = Number(data?.percentRemaining ?? 0);
    const low = Boolean(data?.warningLowBudget) || percent < 10;

    // chart colors
    const COLORS = ["#3182ce", "#38a169"];

    // chart data
    const chartData = data
        ? [
              { name: "Used", value: Number(data.usage ?? 0) },
              { name: "Remaining", value: Number(data.remaining ?? 0) },
          ]
        : [];

    // custom tooltip to format values as currency
    const CustomTooltip = ({ active, payload, label }) => {
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
                <Text fontSize="xs" color="gray.300" mb={1}>
                    {label}
                </Text>
                {payload.map((p) => (
                    <Text key={p.name} fontWeight="semibold">
                        {p.name}: {formatUSD(p.value)}
                    </Text>
                ))}
            </Box>
        );
    };

    return (
        <Box minH="100vh" bg="gray.50">
            {/* Gradient Header Banner */}
            <Box
                bgGradient="to-r"
                gradientFrom="teal.500"
                gradientTo="blue.600"
                color="white"
                py={4}
                px={6}
                boxShadow="md"
            >
                <Box px={4}>
                    <HStack justify="space-between" align="center">
                        <Heading size="xl" fontWeight="bold">
                            OpenRouter Credit Balance
                        </Heading>
                        <Button
                            onClick={fetchBalance}
                            loading={status === "loading"}
                            colorPalette="whiteAlpha"
                            size="md"
                            variant="solid"
                            aria-label="Refresh balance"
                            bg="whiteAlpha.300"
                            _hover={{ bg: "whiteAlpha.400" }}
                        >
                            Refresh
                        </Button>
                    </HStack>
                </Box>
            </Box>

            <Box p={5} px={8}>
                {status === "loading" && !data && (
                    <Card.Root boxShadow="lg">
                        <Card.Body>
                            <HStack>
                                <Spinner />
                                <Text>Loading…</Text>
                            </HStack>
                        </Card.Body>
                    </Card.Root>
                )}

                {status === "error" && (
                    <Alert.Root status="error" mb={4} boxShadow="md">
                        <Alert.Indicator />
                        <Text>{error}</Text>
                    </Alert.Root>
                )}

                {data && (
                    <VStack spacing={5} align="stretch">
                        {low && (
                            <Alert.Root status="warning" boxShadow="md">
                                <Alert.Indicator />
                                <Text fontWeight="semibold">
                                    Warning: you have less than 10% of your
                                    budget left.
                                </Text>
                            </Alert.Root>
                        )}

                        {/* Two-column layout: Stats on left, Chart on right */}
                        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5} gap={2}>
                            {/* Left Column: Summary Stats */}
                            <Card.Root
                                boxShadow="lg"
                                borderWidth="1px"
                                borderColor="gray.200"
                            >
                                <Card.Body>
                                    <Heading size="md" mb={3}>
                                        Budget Summary
                                    </Heading>
                                    <VStack spacing={4} align="stretch">
                                        <Box
                                            bg="blue.50"
                                            p={3}
                                            borderRadius="md"
                                            borderWidth="1px"
                                            borderColor="blue.200"
                                        >
                                            <Stat.Root>
                                                <Stat.Label
                                                    fontSize="sm"
                                                    color="blue.700"
                                                    fontWeight="600"
                                                >
                                                    💰 Total Limit
                                                </Stat.Label>
                                                <Stat.ValueText
                                                    fontSize="3xl"
                                                    fontWeight="800"
                                                    color="blue.900"
                                                    // style={{ filter: "blur(6px)" }} // uncomment to blur the value if needed for sharing
                                                >
                                                    {formatUSD(data.totalLimit)}
                                                </Stat.ValueText>
                                                <Stat.HelpText color="blue.600">
                                                    Reset:{" "}
                                                    {String(
                                                        data.resetPeriod ||
                                                            "N/A",
                                                    )}
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
                                                <Stat.Label
                                                    fontSize="sm"
                                                    color="green.700"
                                                    fontWeight="600"
                                                >
                                                    ⚡ Remaining Credit
                                                </Stat.Label>
                                                <Stat.ValueText
                                                    fontSize="3xl"
                                                    fontWeight="800"
                                                    color="green.900"
                                                    // style={{ filter: "blur(6px)" }} // uncomment to blur the value if needed for sharing
                                                >
                                                    {formatUSD(data.remaining)}
                                                </Stat.ValueText>
                                                <Stat.HelpText color="green.600">
                                                    Budget remaining:{" "}
                                                    {formatPercent(percent)}
                                                </Stat.HelpText>
                                            </Stat.Root>
                                        </Box>

                                        <Box>
                                            <Text
                                                fontSize="sm"
                                                mb={2}
                                                mt={2}
                                                color="gray.700"
                                                fontWeight="600"
                                            >
                                                📊 Budget Progress
                                            </Text>
                                            <Progress.Root
                                                value={Math.max(
                                                    0,
                                                    Math.min(100, percent),
                                                )}
                                                size="lg"
                                                colorPalette={
                                                    percent > 50
                                                        ? "green"
                                                        : percent > 10
                                                          ? "yellow"
                                                          : "red"
                                                }
                                            >
                                                <Progress.Track bg="gray.200">
                                                    <Progress.Range />
                                                </Progress.Track>
                                            </Progress.Root>
                                            <Text
                                                fontSize="2xl"
                                                fontWeight="bold"
                                                mt={2}
                                                textAlign="center"
                                                color="gray.700"
                                            >
                                                {formatPercent(percent)}
                                            </Text>
                                        </Box>

                                        <Box pt={2}>
                                            <Text
                                                fontSize="xs"
                                                color="gray.500"
                                                textAlign="center"
                                            >
                                                Last updated:{" "}
                                                {data.fetchedAt ? (
                                                    <Code fontSize="xs">
                                                        {new Date(
                                                            data.fetchedAt,
                                                        ).toLocaleString()}
                                                    </Code>
                                                ) : (
                                                    "—"
                                                )}
                                            </Text>
                                        </Box>
                                    </VStack>
                                </Card.Body>
                            </Card.Root>

                            {/* Right Column: Large Donut Chart */}
                            <Card.Root
                                boxShadow="lg"
                                borderWidth="1px"
                                borderColor="gray.200"
                            >
                                <Card.Body>
                                    <Heading size="md" mb={3}>
                                        Budget Visualization
                                    </Heading>
                                    <Box
                                        position="relative"
                                        display="flex"
                                        justifyContent="center"
                                        alignItems="center"
                                    >
                                        <ResponsiveContainer
                                            width="100%"
                                            height={350}
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={chartData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={90}
                                                    outerRadius={140}
                                                    label={false}
                                                    paddingAngle={5}
                                                >
                                                    {chartData.map(
                                                        (entry, idx) => (
                                                            <Cell
                                                                key={`cell-${idx}`}
                                                                fill={
                                                                    COLORS[
                                                                        idx %
                                                                            COLORS.length
                                                                    ]
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </Pie>
                                                <Tooltip
                                                    content={<CustomTooltip />}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        {/* Center text showing percentage */}
                                        <Box
                                            position="absolute"
                                            top="50%"
                                            left="50%"
                                            transform="translate(-50%, -50%)"
                                            textAlign="center"
                                            pointerEvents="none"
                                        >
                                            <Text
                                                fontSize="5xl"
                                                fontWeight="900"
                                                color="gray.700"
                                                lineHeight="1"
                                            >
                                                {formatPercent(percent)}
                                            </Text>
                                            <Text
                                                fontSize="sm"
                                                color="gray.500"
                                                mt={1}
                                            >
                                                Remaining
                                            </Text>
                                        </Box>
                                    </Box>

                                    {/* Custom legend */}
                                    <HStack
                                        spacing={6}
                                        mt={4}
                                        justifyContent="center"
                                    >
                                        {chartData.map((d, i) => (
                                            <HStack
                                                key={d.name}
                                                spacing={3}
                                                px={4}
                                                py={2}
                                                borderRadius="md"
                                                bg="gray.50"
                                                borderWidth="1px"
                                                borderColor="gray.200"
                                                _hover={{
                                                    bg: "gray.100",
                                                    transform:
                                                        "translateY(-2px)",
                                                    boxShadow: "md",
                                                }}
                                                transition="all 0.2s"
                                                cursor="pointer"
                                            >
                                                <Box
                                                    w={4}
                                                    h={4}
                                                    borderRadius="full"
                                                    bg={
                                                        COLORS[
                                                            i % COLORS.length
                                                        ]
                                                    }
                                                />
                                                <VStack
                                                    spacing={0}
                                                    align="start"
                                                >
                                                    <Text
                                                        fontSize="xs"
                                                        color="gray.500"
                                                        fontWeight="600"
                                                    >
                                                        {d.name}
                                                    </Text>
                                                    <Text
                                                        fontSize="md"
                                                        fontWeight="bold"
                                                        color="gray.700"
                                                        // style={{ filter: "blur(6px)" }} // uncomment to blur the value if needed for sharing
                                                    >
                                                        {formatUSD(d.value)}
                                                    </Text>
                                                </VStack>
                                            </HStack>
                                        ))}
                                    </HStack>
                                </Card.Body>
                            </Card.Root>
                        </SimpleGrid>

                        {/* Full-width Usage Card */}
                        <Card.Root
                            boxShadow="lg"
                            borderWidth="1px"
                            borderColor="gray.200"
                        >
                            <Card.Body>
                                <Heading size="md" mb={2}>
                                    📈 Usage Breakdown
                                </Heading>
                                <Separator mb={3} />
                                <SimpleGrid
                                    columns={{ base: 1, sm: 2, md: 4 }}
                                    gap={2}
                                >
                                    <Box
                                        bg="purple.50"
                                        p={3}
                                        borderRadius="md"
                                        borderWidth="1px"
                                        borderColor="purple.200"
                                    >
                                        <Stat.Root>
                                            <Stat.Label
                                                fontSize="sm"
                                                color="purple.700"
                                                fontWeight="600"
                                            >
                                                Total Usage
                                            </Stat.Label>
                                            <Stat.ValueText
                                                fontSize="2xl"
                                                fontWeight="800"
                                                color="purple.900"
                                                // style={{ filter: "blur(6px)" }} // uncomment to blur the value if needed for sharing
                                            >
                                                {formatUSD(data.usage)}
                                            </Stat.ValueText>
                                        </Stat.Root>
                                    </Box>

                                    <Box
                                        bg="orange.50"
                                        p={3}
                                        borderRadius="md"
                                        borderWidth="1px"
                                        borderColor="orange.200"
                                    >
                                        <Stat.Root>
                                            <Stat.Label
                                                fontSize="sm"
                                                color="orange.700"
                                                fontWeight="600"
                                            >
                                                Daily
                                            </Stat.Label>
                                            <Stat.ValueText
                                                fontSize="2xl"
                                                fontWeight="800"
                                                color="orange.900"
                                                // style={{ filter: "blur(6px)" }} // uncomment to blur the value if needed for sharing
                                            >
                                                {formatUSD(data.usageDaily)}
                                            </Stat.ValueText>
                                        </Stat.Root>
                                    </Box>

                                    <Box
                                        bg="cyan.50"
                                        p={3}
                                        borderRadius="md"
                                        borderWidth="1px"
                                        borderColor="cyan.200"
                                    >
                                        <Stat.Root>
                                            <Stat.Label
                                                fontSize="sm"
                                                color="cyan.700"
                                                fontWeight="600"
                                            >
                                                Weekly
                                            </Stat.Label>
                                            <Stat.ValueText
                                                fontSize="2xl"
                                                fontWeight="800"
                                                color="cyan.900"
                                                // style={{ filter: "blur(6px)" }} // uncomment to blur the value if needed for sharing
                                            >
                                                {formatUSD(data.usageWeekly)}
                                            </Stat.ValueText>
                                        </Stat.Root>
                                    </Box>

                                    <Box
                                        bg="pink.50"
                                        p={3}
                                        borderRadius="md"
                                        borderWidth="1px"
                                        borderColor="pink.200"
                                    >
                                        <Stat.Root>
                                            <Stat.Label
                                                fontSize="sm"
                                                color="pink.700"
                                                fontWeight="600"
                                            >
                                                Monthly
                                            </Stat.Label>
                                            <Stat.ValueText
                                                fontSize="2xl"
                                                fontWeight="800"
                                                color="pink.900"
                                                // style={{ filter: "blur(6px)" }} // uncomment to blur the value if needed for sharing
                                            >
                                                {formatUSD(data.usageMonthly)}
                                            </Stat.ValueText>
                                        </Stat.Root>
                                    </Box>
                                </SimpleGrid>
                            </Card.Body>
                        </Card.Root>
                    </VStack>
                )}
            </Box>
        </Box>
    );
}
