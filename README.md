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
├── .vscode/
│   ├── tasks.json                         # Auto-start tasks for servers
│   ├── launch.json                        # Debug configurations
│   └── sessions.json                      # Terminal Keeper configuration
├── check_openrouter_credit_balance_flask.py     # Flask API server (port 4000)
├── requirements.txt                       # Python dependencies (includes debugpy)
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
Flask API (localhost:4000) with debugpy debugger
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

**3. Install Node dependencies:**
```bash
npm install
```

**4. Open workspace and auto-start (Recommended):**

Simply open this folder in VS Code. The workspace is configured to automatically:
- Start Vite dev server (port 5173) in a split terminal
- Start Flask API with debugpy debugger (port 4000, debugger port 5678) in split terminal
- Attach the Python debugger (set breakpoints in Flask code!)
- Launch Chrome browser with the dashboard

Press **F5** or just open the workspace to start everything!

**Manual Start (Alternative):**

If you prefer to start servers manually:

```bash
# Terminal 1 - Start Flask API
python check_openrouter_credit_balance_flask.py

# Terminal 2 - Start Vite dev server
npm run dev
```

## Development & Debugging

### Debugging Flask API

The Flask API runs with **debugpy**, allowing you to set breakpoints in your Python code:

1. Set breakpoints in [check_openrouter_credit_balance_flask.py](check_openrouter_credit_balance_flask.py)
2. Press **F5** (or use Run → Start Debugging)
3. The debugger automatically attaches to Flask on port 5678
4. Trigger a request from the dashboard to hit your breakpoints

### Split Terminal View

Both servers run in a **split terminal view** grouped as "servers":
- **Left pane**: Vite Dev Server
- **Right pane**: Flask API with debugpy

This keeps your development environment organized and allows easy monitoring of both servers simultaneously.

## Technologies

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Chakra UI v3** - Component library
- **Recharts** - Data visualization
- **Flask** - Python API server for real-time OpenRouter data
- **debugpy** - Python debugger for Flask API debugging

## API

The dashboard fetches live balance data from: `http://localhost:4000/api/openrouter/balance`

Data refreshes automatically every 60 seconds and on manual refresh button click.
