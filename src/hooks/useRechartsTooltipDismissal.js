import React from "react";

// The tooltip overlay itself should never intercept pointer movement.
const TOOLTIP_WRAPPER_STYLE = { pointerEvents: "none" };

/**
 * Centralizes the extra tooltip cleanup we need for Recharts pie charts.  
 * Intented to resolve the issue of "stuck" tooltips that can occur when 
 * the pointer moves quickly between slices, leaving Recharts' internal 
 * hover state out of sync with reality.
 *
 * Detail:
 * Recharts normally owns hover state internally, but fast pointer transitions
 * can leave the last hovered slice active long enough for the tooltip to stay
 * visible. This hook adds the interruption handling that Recharts misses:
 * suppress the tooltip on leave or browser focus loss, remount it to clear any
 * stale internal hover state, and then hand control back to Recharts on the
 * next chart entry.
 */
export function useRechartsTooltipDismissal({ enabled = true } = {}) {
    const [isTooltipSuppressed, setIsTooltipSuppressed] = React.useState(false);
    const [tooltipInstanceKey, setTooltipInstanceKey] = React.useState(0);

    // Suppress and remount the tooltip whenever interaction is interrupted.
    const dismissTooltip = React.useCallback(() => {
        if (!enabled) {
            return;
        }

        setIsTooltipSuppressed(true);
        // Reset the tooltip instance so stale internal hover state does not leak into the next pass.
        setTooltipInstanceKey((currentKey) => currentKey + 1);
    }, [enabled]);

    // Once the pointer comes back, let Recharts resume its normal hover logic.
    const releaseTooltip = React.useCallback(() => {
        if (!enabled) {
            return;
        }

        setIsTooltipSuppressed(false);
    }, [enabled]);

    React.useEffect(() => {
        if (!enabled) {
            return undefined;
        }

        // Abrupt window exits do not always send a reliable leave event to the chart.
        const handleWindowBlur = () => {
            dismissTooltip();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState !== "visible") {
                dismissTooltip();
            }
        };

        window.addEventListener("blur", handleWindowBlur);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("blur", handleWindowBlur);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
        };
    }, [dismissTooltip, enabled]);

    // Keep the chart-surface interruption points consistent across every pie card.
    const chartSurfaceProps = React.useMemo(
        () => ({
            onMouseEnter: releaseTooltip,
            onMouseLeave: dismissTooltip,
            onPointerEnter: releaseTooltip,
            onPointerLeave: dismissTooltip,
            onPointerCancel: dismissTooltip,
            onTouchCancel: dismissTooltip,
            onTouchEnd: dismissTooltip,
        }),
        [dismissTooltip, releaseTooltip],
    );

    // Only take control when suppressing a stale tooltip; otherwise stay hands-off.
    const tooltipProps = React.useMemo(
        () => ({
            active: isTooltipSuppressed ? false : undefined,
            isAnimationActive: false,
            wrapperStyle: TOOLTIP_WRAPPER_STYLE,
        }),
        [isTooltipSuppressed],
    );

    return {
        chartSurfaceProps,
        dismissTooltip,
        releaseTooltip,
        tooltipInstanceKey,
        tooltipProps,
    };
}