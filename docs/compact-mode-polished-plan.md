# Compact Mode Plan For Pie Cards

## Goal

Add a polished compact mode for the OpenRouter and GitHub Copilot pie cards so users can collapse the entire metrics section under each pie chart and view a chart-only version of the card when desired.

This document captures the decisions already made and the proposed implementation approach for review before any code changes begin.

## Scope

In scope:

- OpenRouter Budget Visualization card
- GitHub Copilot Pro Budget Visualization card
- Dashboard-level compact mode control in the header
- Per-card compact mode control on each eligible card
- Compact and expanded interaction behavior
- Animation, accessibility, and layout expectations

Out of scope for this phase:

- Persistence across refresh or browser restarts
- Reworking the Codex card unless explicitly approved later
- Changing the actual budget calculations or chart data
- Restructuring the overall three-column dashboard layout

## Locked Decisions

The following decisions are considered approved unless revised in review:

1. The metrics area under each pie chart should be fully collapsible.
2. When collapsed, the user should be able to see the pie chart alone rather than a partially reduced metrics tray.
3. Each eligible card should support its own local expand or collapse control.
4. The dashboard should also support a global compact mode control that collapses all eligible cards at once.
5. The default dashboard state on load should remain expanded.
6. Compact state should not persist across refresh or reopen.
7. When collapsed, the card should still show:
   - The card title
   - The pie chart
   - The center text inside the chart
   - A small explicit expand control
8. Uneven card heights across the row are acceptable when some cards are collapsed and others are expanded.
9. This should be implemented as a polished compact mode, not only a raw hide and show toggle.

## Recommended UX Model

### Card-Level Behavior

Each pie card gets a compact toggle in the card header, aligned to the top-right area.

Expanded state:

- Title remains visible
- Existing metadata remains visible
- Pie chart remains visible
- Metrics section under the chart remains visible
- Toggle action reads as a collapse action

Collapsed state:

- Title remains visible
- Existing metadata remains visible unless explicitly trimmed later
- Pie chart remains visible
- Center chart text remains visible
- Entire metrics section under the chart is hidden
- Toggle action reads as an expand action

The compact state should feel like a deliberate mode change rather than a missing block of content.

### Dashboard-Level Behavior

The dashboard header gets a global compact mode control.

Behavior model:

1. Turning global compact mode on collapses all eligible cards immediately.
2. After global compact mode is on, a user may re-expand an individual card.
3. Turning global compact mode off returns all eligible cards to the expanded state.

This model keeps the dashboard-wide control easy to reason about and avoids ambiguous mixed-state behavior.

## Why This Direction Was Chosen

This approach fits the current dashboard because:

1. The chart is already the dominant visual element in both cards.
2. The metrics rows act like a footer block and can be hidden cleanly as one section.
3. A header-based toggle is discoverable and stays available in both expanded and collapsed states.
4. A global compact mode supports the user goal of scanning multiple charts quickly.
5. Per-card overrides retain flexibility without forcing all cards into the same mode.

## Visual Design Intent

The collapsed version should not look like a broken or incomplete card.

To achieve that:

1. Card spacing should tighten slightly in compact mode.
2. The chart area should subtly re-center when the metrics section disappears.
3. The bottom padding should be adjusted so the card feels intentionally compact.
4. The toggle should look native to the card, not like an afterthought.
5. Motion should be light and fast rather than dramatic.

## Proposed Interaction Details

### Card Toggle Placement

Recommended placement:

- Top-right of the card header area
- Small ghost button or icon button
- Visible in both expanded and collapsed states

Recommended labels:

- Expanded: Hide details
- Collapsed: Show details

Alternative acceptable label set:

- Expanded: Compact
- Collapsed: Expand

The first set is clearer about what content changes.

### Animation

Recommended animation behavior:

- Metrics section animates height and opacity during collapse and expand
- Chart area subtly shifts to its compact spacing rather than jumping abruptly
- Animation duration should stay short, roughly 150 to 200 milliseconds

### Accessibility

The controls should support:

- Keyboard access
- Visible focus state
- Screen-reader label that identifies the target card
- Accurate expanded or collapsed state through aria attributes

Example label pattern:

- Show details for OpenRouter Budget Visualization
- Hide details for GitHub Copilot Pro Budget Visualization

## State Model

The recommended state model separates global mode from local overrides.

Suggested shape:

- A dashboard-level boolean for global compact mode
- A per-card override map keyed by card identifier

Conceptually:

1. If global compact mode is off, all cards render expanded.
2. If global compact mode is on, cards render collapsed unless locally overridden open.
3. Disabling global compact mode clears the compact presentation and returns all cards to expanded.

This keeps the UI predictable and prevents stale edge-case states.

## Component Plan

### UsageDashboard

Likely responsibilities:

- Own global compact mode state
- Own per-card override state
- Pass compact state and toggle handlers into each eligible card
- Provide the header-level global compact toggle

Primary file:

- src/UsageDashboard.jsx

### Dashboard Header

Likely responsibilities:

- Render a global compact mode control alongside refresh behavior
- Communicate whether the dashboard is in chart-focused compact mode

Primary file:

- src/components/DashboardHeader.jsx

### OpenRouter Card

Likely responsibilities:

- Accept compact state as a prop
- Render a local expand or collapse control
- Animate and conditionally hide the full metrics block under the chart
- Adjust compact spacing without changing the chart data logic

Primary file:

- src/components/openrouter/OpenRouterBudgetPieCard.jsx

### Copilot Card

Likely responsibilities:

- Accept compact state as a prop
- Render a local expand or collapse control
- Animate and conditionally hide the full metrics block under the chart
- Adjust compact spacing without changing the chart data logic

Primary file:

- src/components/copilot/CopilotPremiumPieCard.jsx

### Shared UI Helper

Recommended if implementation starts:

- Create a small shared card action or compact toggle component to avoid duplicating button markup and accessibility logic between cards

Possible location:

- src/components/

Exact filename can be decided during implementation.

## Layout Expectations

1. The dashboard should continue using the existing three-column layout on wide screens.
2. Cards may have uneven heights when some are compact and others are expanded.
3. The layout should not attempt to force equal-height rows during mixed state.
4. Compact cards should remain visually balanced even when neighboring cards are taller.

## Implementation Sequence

If this plan is approved, recommended implementation order is:

1. Add global compact state and per-card override state in the dashboard.
2. Add a global compact toggle to the header.
3. Add a reusable compact toggle control pattern for cards.
4. Update the OpenRouter card to support compact and expanded modes.
5. Update the Copilot card to support compact and expanded modes.
6. Verify layout behavior in mixed expanded and collapsed combinations.
7. Verify keyboard and screen-reader behavior.
8. Verify motion and spacing feel intentional rather than abrupt.

## Acceptance Criteria

This work should be considered complete when:

1. The OpenRouter card can hide all metrics below the pie chart.
2. The Copilot card can hide all metrics below the pie chart.
3. Each card has its own local toggle.
4. The dashboard has a global compact toggle.
5. Default load state is expanded.
6. No compact state is persisted across refresh.
7. Collapsed cards still show title, chart, center text, and an explicit expand control.
8. Mixed card heights are allowed and render acceptably.
9. Collapse and expand interactions are keyboard accessible.
10. The compact mode feels visually intentional through spacing and transition polish.

## Risks And Things To Watch

1. If global and local state are not modeled clearly, the interaction can become confusing.
2. If spacing is not adjusted in compact mode, collapsed cards may look unfinished.
3. If the toggle placement is too subtle, users may miss the feature entirely.
4. If animation is too large, the cards will feel jumpy in a dashboard context.

## Current Review Status

Planned only. No implementation has been started yet.

This document is ready for review and revision before code changes begin.