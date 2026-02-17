export function formatUSD(value) {
    const n = Number(value ?? 0);
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function formatPercent(value, digits = 1) {
    const n = Number(value ?? 0);
    return `${n.toFixed(digits)}%`;
}

export function formatRequestCount(value) {
    const n = Number(value ?? 0);
    const hasDecimals = Math.abs(n % 1) > Number.EPSILON;
    return n.toLocaleString("en-US", {
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: 2,
    });
}

export function formatMonthYear(timePeriod) {
    const month = Number(timePeriod?.month);
    const year = Number(timePeriod?.year);
    if (!month || !year) {
        return "Current period";
    }

    return new Date(year, month - 1, 1).toLocaleString("en-US", {
        month: "long",
        year: "numeric",
    });
}

export function formatLocalDateTime(value) {
    if (!value) {
        return "—";
    }
    return new Date(value).toLocaleString();
}
