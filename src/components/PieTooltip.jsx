import {
    Box,
    Text,
    TooltipContent,
    TooltipPositioner,
    TooltipRoot,
    TooltipTrigger,
} from "@chakra-ui/react";
import { formatUSD } from "../utils/formatters.js";

/**
 * Recharts custom tooltip for pie charts displaying USD-valued slices.
 * Pass as: <RechartsTooltip content={<PieTooltip />} />
 */
export function PieTooltip({ active, payload }) {
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
                    {item.name}: {formatUSD(item.value)}
                </Text>
            ))}
        </Box>
    );
}

const labelTextProps = {
    fontSize: "xs",
    color: "gray.500",
    fontWeight: "600",
};

/**
 * Inline label with a gray ⓘ badge that reveals a Chakra tooltip on hover.
 * - With `label`: renders the ⓘ badge and shows the tooltip on hover.
 * - Without `label`: renders a plain text label with no badge or tooltip.
 */
export function InfoTooltip({ label, children }) {
    if (!label) {
        return (
            <Text {...labelTextProps}>
                {children}
            </Text>
        );
    }

    return (
        <TooltipRoot openDelay={100} closeDelay={100}>
            <TooltipTrigger asChild>
                <Text
                    {...labelTextProps}
                    cursor="help"
                    display="inline-flex"
                    alignItems="center"
                    gap={1}
                >
                    {children}
                    <Box
                        as="span"
                        display="inline-flex"
                        alignItems="center"
                        justifyContent="center"
                        w={3}
                        h={3}
                        borderRadius="full"
                        bg="gray.400"
                        color="white"
                        fontSize="8px"
                        fontWeight="700"
                        lineHeight="1"
                        flexShrink={0}
                    >
                        i
                    </Box>
                </Text>
            </TooltipTrigger>
            <TooltipPositioner>
                <TooltipContent>{label}</TooltipContent>
            </TooltipPositioner>
        </TooltipRoot>
    );
}
