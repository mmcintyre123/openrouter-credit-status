import { Alert, Text } from "@chakra-ui/react";

export default function SectionAlert({ status = "error", message, mb = 0 }) {
    return (
        <Alert.Root status={status} mb={mb} borderRadius="md" boxShadow="sm">
            <Alert.Indicator />
            <Text fontSize="sm">{message}</Text>
        </Alert.Root>
    );
}
