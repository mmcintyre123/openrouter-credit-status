# OpenRouter + Copilot Usage Dashboard

A compact, single-page dashboard that visualizes:
- OpenRouter credit balance and usage
- GitHub Copilot Pro premium request usage (included pool + overage)

## Architecture

```text
openrouter-credit-status/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── OpenRouterBalanceDashboard.jsx
│   ├── hooks/
│   │   ├── useOpenRouterBalance.js
│   │   ├── useCopilotPremiumUsage.js
│   │   └── useOpenRouterBalanceDashboard.jsx
│   ├── components/
│   │   ├── DashboardHeader.jsx
│   │   ├── SectionAlert.jsx
│   │   ├── openrouter/
│   │   │   ├── OpenRouterSummaryCard.jsx
│   │   │   ├── OpenRouterUsageBreakdownCard.jsx
│   │   │   └── OpenRouterBudgetPieCard.jsx
│   │   └── copilot/
│   │       ├── CopilotSummaryCard.jsx
│   │       └── CopilotPremiumPieCard.jsx
│   ├── utils/
│   │   └── formatters.js
│   └── resources/
│       └── SampleResponseGithubPremiumRequestUsage.json
├── check_openrouter_credit_balance_flask.py
├── config/
│   └── dashboard.properties
├── docs/
│   ├── copilot-premium-usage-implementation-plan.md
│   └── copilot-premium-usage-request-pattern.md
└── README.md
```

## Design Decisions (v1)

- Data source for Copilot metrics is a Flask backend proxy endpoint.
- OpenRouter and Copilot requests run in parallel on initial load, manual refresh, and every 60 seconds.
- Section-level error handling supports partial failures (one section can fail while the other remains rendered).
- Copilot usage period is current month/year by default because backend calls GitHub without `year/month/day` query params.
- Desktop layout is optimized for a compact one-page view (`1920x1200` target), while smaller screens remain responsive.

## Data Flow

1. Browser loads dashboard at `http://localhost:5173`.
2. Frontend calls both backend endpoints in parallel.
3. Flask backend fetches:
- OpenRouter key usage from `https://openrouter.ai/api/v1/key`
- Copilot premium usage from `https://api.github.com/users/{username}/settings/billing/premium_request/usage`
4. Backend normalizes and returns stable JSON contracts.
5. Frontend renders cards/charts per section and applies independent loading/error states.

## API Endpoints

- OpenRouter balance: `GET http://localhost:4000/api/openrouter/balance`
- Copilot premium usage: `GET http://localhost:4000/api/github/copilot/premium-usage`

### Copilot normalization logic

From GitHub `usageItems`, backend computes:
- `includedUsed = sum(discountQuantity)`
- `includedRemaining = max(monthlyLimit - includedUsed, 0)`
- `includedPercentUsed = min((includedUsed / monthlyLimit) * 100, 100)`
- `grossUsed = sum(grossQuantity)`
- `netOverage = sum(netQuantity)`
- `billedAmount = sum(netAmount)`

`timePeriod` is passed through from GitHub.

Example response shape:

```json
{
  "plan": { "name": "Copilot Pro", "monthlyLimit": 300.0 },
  "user": "your-username",
  "timePeriod": { "year": 2026, "month": 2 },
  "totals": {
    "includedUsed": 300.0,
    "includedRemaining": 0.0,
    "includedPercentUsed": 100.0,
    "grossUsed": 300.44,
    "netOverage": 0.44,
    "billedAmount": 0.0176
  },
  "usageItems": [],
  "fetchedAt": "2026-02-14T12:34:56"
}
```

## Configuration

### Environment variables

Set:

```bash
# OpenRouter
export ANTHROPIC_AUTH_TOKEN="your-openrouter-key"      # Linux/Mac
set ANTHROPIC_AUTH_TOKEN=your-openrouter-key            # Windows CMD
$env:ANTHROPIC_AUTH_TOKEN="your-openrouter-key"        # Windows PowerShell

# GitHub Copilot PAT (Personal Access Token)
export GITHUB_PAT="your-github-pat"                    # Linux/Mac
set GITHUB_PAT=your-github-pat                          # Windows CMD
$env:GITHUB_PAT="your-github-pat"                      # Windows PowerShell
```

### `config/dashboard.properties`

Required/optional values:

```properties
GITHUB_USERNAME=your-github-username
COPILOT_PRO_MONTHLY_LIMIT=300
```

`COPILOT_PRO_MONTHLY_LIMIT` defaults to `300` if missing/invalid.

## Quick Start

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Install Node dependencies:

```bash
npm install
```

3. Configure env vars and `config/dashboard.properties`.

4. Start services:

```bash
# Terminal 1
python check_openrouter_credit_balance_flask.py

# Terminal 2
npm run dev
```

Dashboard URL: `http://localhost:5173`

## VS Code Auto-Start / Debug

On workspace open (or `F5`), VS Code can auto-start:
- Vite dev server on `5173`
- Flask API with `debugpy` on `4000` (debug port `5678`)
- Debugger attach session
- Browser launch

See `.vscode/tasks.json` and `.vscode/launch.json` for an example configuration.

### Debugging Flask API with breakpoints

1. Set breakpoints in `check_openrouter_credit_balance_flask.py`.
2. Press `F5` (or use Run -> Start Debugging).
3. Confirm the debugger is attached to Flask on port `5678`.
4. Trigger a dashboard refresh or call an API endpoint to hit breakpoints.

## UI Layout (Current)

- Header row: dashboard title + refresh action.
- Content row 1 (`xl`): OpenRouter summary, OpenRouter usage breakdown, Copilot summary.
- Content row 2 (`xl`): OpenRouter budget pie, Copilot budget pie.
- Warning and refresh-failure alerts render above the grids.

## Frontend Notes

- `useOpenRouterBalanceDashboard` orchestrates both data sources and drives partial-failure rendering.
- `CopilotSummaryCard` includes a fallback for billed amount from `usageItems[].netAmount` if `totals.billedAmount` is absent.
- Formatting is centralized in `src/utils/formatters.js`.

## Technologies

- React + Vite
- Chakra UI v3
- Recharts
- Flask + requests + flask-cors
- debugpy
