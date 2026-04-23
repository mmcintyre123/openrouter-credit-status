import React from "react";
import {
    Button,
    Dialog,
    HStack,
    Portal,
    Separator,
    Switch,
    Text,
    VStack,
} from "@chakra-ui/react";

export default function CardVisibilityDialog({
    isOpen = false,
    onOpenChange,
    cardOptions = [],
    cardVisibility = {},
    visibleCardCount = 0,
    onSetCardVisibility,
}) {
    return (
        <Dialog.Root
            open={isOpen}
            onOpenChange={(details) => onOpenChange(details.open)}
            placement="center"
            size="sm"
        >
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner p={4}>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>Manage Cards</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <Text fontSize="sm" color="gray.600" mb={4}>
                                Choose which usage cards are visible on the
                                dashboard.
                            </Text>

                            <VStack
                                align="stretch"
                                gap={0}
                                borderWidth="1px"
                                borderColor="gray.200"
                                borderRadius="lg"
                                overflow="hidden"
                            >
                                {cardOptions.map((card, index) => {
                                    const isVisible = Boolean(
                                        cardVisibility[card.key],
                                    );
                                    const isLastVisibleCard =
                                        visibleCardCount === 1 && isVisible;

                                    return (
                                        <React.Fragment key={card.key}>
                                            <Switch.Root
                                                checked={isVisible}
                                                disabled={isLastVisibleCard}
                                                colorPalette="teal"
                                                display="flex"
                                                justifyContent="space-between"
                                                alignItems="center"
                                                gap={4}
                                                px={4}
                                                py={3}
                                                bg="white"
                                                onCheckedChange={(details) =>
                                                    onSetCardVisibility(
                                                        card.key,
                                                        details.checked,
                                                    )
                                                }
                                            >
                                                <Switch.HiddenInput />
                                                <Switch.Label
                                                    fontSize="sm"
                                                    fontWeight="600"
                                                    color="gray.700"
                                                >
                                                    {card.label}
                                                </Switch.Label>
                                                <Switch.Control>
                                                    <Switch.Thumb />
                                                </Switch.Control>
                                            </Switch.Root>
                                            {index < cardOptions.length - 1 && (
                                                <Separator />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </VStack>

                            {visibleCardCount === 1 && (
                                <Text fontSize="sm" color="orange.700" mt={4}>
                                    At least one card must stay visible.
                                </Text>
                            )}
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Done
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}
