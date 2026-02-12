# OpenRouter Credit Balance Dashboard

A simple dashboard to visualize OpenRouter API credit balance with interactive charts and real-time data.

## Architecture

```
openrouter-credit-status/
├── src/
│   ├── main.jsx                           # App entry point, ChakraProvider setup
│   ├── App.jsx                            # Root component
│   ├── OpenRouterBalanceDashboard.jsx     # Main dashboard component
│   ├── index.css                          # Global styles
│   └── assets/                            # Static assets
├── public/                                # Public static files
├── check_openrouter_credit_balance.py     # Flask API server (port 4000)
├── requirements.txt                       # Python dependencies
├── package.json                           # Node.js dependencies
├── vite.config.js                         # Vite configuration
├── eslint.config.js                       # ESLint configuration
└── README.md                              # This file
```

**Component Flow:**
```
User Browser (localhost:5173)
    ↓
OpenRouterBalanceDashboard.jsx
    ├── Fetches data every 60s from Flask API
    ├── Manual refresh via Button click
    ├── Renders with Chakra UI v3 components
    │   ├── Card (balance summary)
    │   ├── Stat (metrics display)
    │   ├── Progress (budget visualization)
    │   └── Alert (low budget warning)
    └── Charts with Recharts
        ├── PieChart (donut chart)
        ├── Custom Tooltip (currency formatting)
        └── Custom Legend (interactive)
    ↓
Flask API (localhost:4000)
    └── /api/openrouter/balance endpoint
        ├── Authenticates with ANTHROPIC_AUTH_TOKEN
        ├── Calls OpenRouter API (api.openrouter.ai)
        ├── Transforms response data
        └── Returns JSON:
            {
              "totalLimit": 500.00,
              "remaining": 158.61,
              "resetPeriod": "monthly",
              "usage": 341.49,
              "usageDaily": 90.77,
              "usageWeekly": 341.39,
              "usageMonthly": 341.39,
              "percentRemaining": 31.7,
              "warningLowBudget": false,
              "fetchedAt": "2026-02-12T16:39:47.000Z"
            }
```

**Data Flow:**
1. User opens dashboard in browser (localhost:5173)
2. React app fetches balance data from Flask API endpoint
3. Flask server authenticates with OpenRouter API using `ANTHROPIC_AUTH_TOKEN`
4. OpenRouter returns credit balance, usage, and limit data
5. Flask transforms and returns JSON to frontend
6. React renders data using Chakra UI components and Recharts visualizations
7. Dashboard auto-refreshes every 60 seconds or on manual button click

## Quick Start

**1. Install Python dependencies:**
```bash
pip install -r requirements.txt
```

**2. Set your OpenRouter API key:**
```bash
export ANTHROPIC_AUTH_TOKEN="your-api-key-here"  # Linux/Mac
set ANTHROPIC_AUTH_TOKEN=your-api-key-here       # Windows CMD
$env:ANTHROPIC_AUTH_TOKEN="your-api-key-here"    # Windows PowerShell
```

**3. Start the Flask API server:**
```bash
python check_openrouter_credit_balance.py
```

**4. Start the Vite dev server:**
```bash
npm run dev
```

## Technologies

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Chakra UI v3** - Component library
- **Recharts** - Data visualization
- **Flask** - Python API server for real-time OpenRouter data

## API

The dashboard fetches live balance data from: `http://localhost:4000/api/openrouter/balance`

Data refreshes automatically every 60 seconds and on manual refresh button click.
