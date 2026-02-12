import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import React from 'react';
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
  SimpleGrid
} from '@chakra-ui/react';

function formatUSD(value) {
  const n = Number(value ?? 0);
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
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
  const [status, setStatus] = React.useState('idle'); // idle | loading | ok | error
  const [error, setError] = React.useState('');

  const fetchBalance = React.useCallback(async () => {
    setStatus('loading');
    setError('');

    try {
      const res = await fetch('http://localhost:4000/api/openrouter/balance', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Request failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`);
      }

      const json = await res.json();
      setData(json);
      setStatus('ok');
    } catch (e) {
      setStatus('error');
      setError(e?.message || 'Unknown error');
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
  const COLORS = ['#3182ce', '#38a169'];

  // chart data
  const chartData = data
    ? [
        { name: 'Used', value: Number(data.usage ?? 0) },
        { name: 'Remaining', value: Number(data.remaining ?? 0) }
      ]
    : [];

  // custom tooltip to format values as currency
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <Box bg="gray.800" color="white" p={3} borderRadius="md" fontSize="sm" boxShadow="lg">
        <Text fontSize="xs" color="gray.300" mb={1}>{label}</Text>
        {payload.map((p) => (
          <Text key={p.name} fontWeight="semibold">
            {p.name}: {formatUSD(p.value)}
          </Text>
        ))}
      </Box>
    );
  };

  return (
    <Box p={6} maxW="900px" mx="auto">
      <HStack justify="space-between" mb={4} align="center">
        <Heading size="lg">OpenRouter Credit Balance</Heading>
        <Button
          onClick={fetchBalance}
          loading={status === 'loading'}
          colorPalette="blue"
          size="sm"
          variant="solid"
          aria-label="Refresh balance"
        >
          Refresh
        </Button>
      </HStack>

      {status === 'loading' && !data && (
        <HStack>
          <Spinner />
          <Text>Loading…</Text>
        </HStack>
      )}

      {status === 'error' && (
        <Alert.Root status="error" mb={4}>
          <Alert.Indicator />
          <Text>{error}</Text>
        </Alert.Root>
      )}

      {data && (
        <VStack spacing={4} align="stretch">
          {low && (
            <Alert.Root status="warning">
              <Alert.Indicator />
              <Text fontWeight="semibold">Warning: you have less than 10% of your budget left.</Text>
            </Alert.Root>
          )}

          <Card.Root>
            <Card.Body>
              {/* responsive layout: 1 column on small screens, 3 on md+ */}
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} alignItems="start">
                <Box>
                  <Stat.Root>
                    <Stat.Label fontSize="sm" color="gray.500">Total Limit</Stat.Label>
                    <Stat.ValueText fontSize={{ base: 'xl', md: '2xl' }} fontWeight="700">
                      {formatUSD(data.totalLimit)}
                    </Stat.ValueText>
                    <Stat.HelpText>Reset: {String(data.resetPeriod || 'N/A')}</Stat.HelpText>
                  </Stat.Root>
                </Box>

                <Box>
                  <Stat.Root>
                    <Stat.Label fontSize="sm" color="gray.500">Remaining Credit</Stat.Label>
                    <Stat.ValueText fontSize={{ base: 'xl', md: '2xl' }} fontWeight="700">
                      {formatUSD(data.remaining)}
                    </Stat.ValueText>
                    <Stat.HelpText>Budget remaining: {formatPercent(percent)}</Stat.HelpText>
                  </Stat.Root>
                </Box>

                <Box>
                  <Text fontSize="sm" mb={2} color="gray.600">Remaining %</Text>
                  <Progress.Root value={Math.max(0, Math.min(100, percent))} size="lg">
                    <Progress.Track>
                      <Progress.Range />
                    </Progress.Track>
                  </Progress.Root>

                  <Box mt={4} display="flex" justifyContent="center" alignItems="center">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={80}
                          label={false}
                          paddingAngle={3}
                        >
                          {chartData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>

                  {/* custom legend (better hover/focus styling) */}
                  <HStack spacing={4} mt={3} justifyContent="center">
                    {chartData.map((d, i) => (
                      <HStack
                        key={d.name}
                        spacing={2}
                        px={3}
                        py={1}
                        borderRadius="md"
                        _hover={{ bg: 'gray.50' }}
                        _focus={{ boxShadow: 'outline' }}
                        tabIndex={0}
                        role="button"
                        aria-label={`${d.name} legend`}
                        cursor="pointer"
                      >
                        <Box w={3} h={3} borderRadius="full" bg={COLORS[i % COLORS.length]} />
                        <Text fontSize="sm" color="gray.600">{d.name}</Text>
                      </HStack>
                    ))}
                  </HStack>

                  <Text fontSize="xs" mt={2} color="gray.500" textAlign={{ base: 'left', md: 'center' }}>
                    Last updated:{' '}
                    {data.fetchedAt ? (
                      <Code>{new Date(data.fetchedAt).toLocaleString()}</Code>
                    ) : (
                      '—'
                    )}
                  </Text>
                </Box>
              </SimpleGrid>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <Heading size="md" mb={3}>Usage</Heading>
              <Separator mb={4} />
              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
                <Box>
                  <Stat.Root>
                    <Stat.Label fontSize="sm" color="gray.500">Total Usage</Stat.Label>
                    <Stat.ValueText fontSize="xl" fontWeight="700">{formatUSD(data.usage)}</Stat.ValueText>
                  </Stat.Root>
                </Box>

                <Box>
                  <Stat.Root>
                    <Stat.Label fontSize="sm" color="gray.500">Daily</Stat.Label>
                    <Stat.ValueText fontSize="xl" fontWeight="700">{formatUSD(data.usageDaily)}</Stat.ValueText>
                  </Stat.Root>
                </Box>

                <Box>
                  <Stat.Root>
                    <Stat.Label fontSize="sm" color="gray.500">Weekly</Stat.Label>
                    <Stat.ValueText fontSize="xl" fontWeight="700">{formatUSD(data.usageWeekly)}</Stat.ValueText>
                  </Stat.Root>
                </Box>

                <Box>
                  <Stat.Root>
                    <Stat.Label fontSize="sm" color="gray.500">Monthly</Stat.Label>
                    <Stat.ValueText fontSize="xl" fontWeight="700">{formatUSD(data.usageMonthly)}</Stat.ValueText>
                  </Stat.Root>
                </Box>
              </SimpleGrid>
            </Card.Body>
          </Card.Root>
        </VStack>
      )}
    </Box>
  );
}
