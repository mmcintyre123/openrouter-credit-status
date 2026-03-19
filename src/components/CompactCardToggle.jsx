import { Button } from "@chakra-ui/react";

export default function CompactCardToggle({
    isCompact = false,
    title,
    controlsId,
    onToggle,
}) {
    const actionLabel = isCompact ? "Show details" : "Hide details";

    return (
        <Button
            size="xs"
            variant="ghost"
            colorPalette="gray"
            aria-controls={controlsId}
            aria-expanded={!isCompact}
            aria-label={`${actionLabel} for ${title}`}
            onClick={onToggle}
            flexShrink={0}
            minW="auto"
            ml={1}
            px={2}
        >
            {actionLabel}
        </Button>
    );
}