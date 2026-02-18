# OpenRouter + Copilot + Codex Usage Dashboard

A compact single-page dashboard that visualizes:
- OpenRouter credit balance and usage
- GitHub Copilot Pro premium request usage
- ChatGPT Codex limits

## Architecture

```text
openrouter-credit-status/
├── backend/
│   ├── __init__.py
│   ├── app.py
│   ├── config.py
│   ├── get_model_limit_balances.py
│   └── helpers/
│       ├── common.py
│       ├── openrouter_helper.py
│       ├── copilot_helper.py
│       └── codex_helper.py
├── run_api.py
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── UsageDashboard.jsx
│   ├── api/
│   │   └── endpoints.js
│   ├── hooks/
│   │   ├── useApiResource.js
│   │   └── useUsageDashboard.jsx
│   ├── components/
│   └── utils/
├── config/
│   └── dashboard.properties
└── README.md
```

## Design Decisions

- The backend is split by concern: Flask app bootstrapping in `backend/app.py`, route orchestration in `backend/get_model_limit_balances.py`, provider-specific logic in `backend/helpers/`.
- Public API routes remain stable while internals evolve:
  - `/api/openrouter/balance`
  - `/api/github/copilot/premium-usage`
  - `/api/openai/codex/limits`
- Frontend orchestration is provider-agnostic (`UsageDashboard` + `useUsageDashboard`) and calls `useApiResource` directly with centralized `API_ENDPOINTS`.
- Provider fetches are independent, so partial failures are tolerated and surfaced at card level instead of failing the entire page.
- Common async fetch state behavior is centralized in `useApiResource` to avoid repeated loading/error boilerplate.
- Backend responses are normalized before returning to the UI, so chart components do not depend on raw third-party response shapes.

## Data Flow

1. Browser loads `http://localhost:5173`.
2. `UsageDashboard` triggers `useUsageDashboard`, which runs provider hooks in parallel.
3. Frontend calls backend endpoints on `http://localhost:4000`:
   - `GET /api/openrouter/balance`
   - `GET /api/github/copilot/premium-usage`
   - `GET /api/openai/codex/limits`
4. Flask routes in `backend/get_model_limit_balances.py` validate config/env and delegate to provider helpers.
5. Provider helpers call upstream APIs:
   - OpenRouter key usage API
   - GitHub Copilot premium usage API
   - ChatGPT Codex WHAM usage API
6. Helpers normalize payloads and route handlers return stable JSON contracts.
7. Frontend renders each card independently with its own loading/error/success state.

## API Endpoints

- `GET http://localhost:4000/api/openrouter/balance`
- `GET http://localhost:4000/api/github/copilot/premium-usage`
- `GET http://localhost:4000/api/openai/codex/limits`

## Configuration

Set environment variables:

```bash
# OpenRouter
$env:ANTHROPIC_AUTH_TOKEN="your-openrouter-key"

# GitHub Copilot PAT
$env:GITHUB_PAT="your-github-pat"

# Optional ChatGPT auth override for Codex limits endpoint
$env:CHATGPT_ACCESS_TOKEN="your-chatgpt-access-token"
$env:CHATGPT_ACCOUNT_ID="your-chatgpt-account-id"
```

Set `config/dashboard.properties`:

```properties
GITHUB_USERNAME=your-github-username
COPILOT_PRO_MONTHLY_LIMIT=300
```

## Quick Start

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Install Node dependencies:

```bash
npm install
```

3. Start services:

```bash
# Terminal 1
python run_api.py

# Terminal 2
npm run dev
```

Dashboard URL: `http://localhost:5173`

## VS Code Auto-Start / Debug

On workspace open (or `F5` to start the debugger), VS Code can auto-start:
- Vite dev server on `5173`
- Flask API with `debugpy` on `4000` (debug port `5678`)
- Debugger attach session
- Browser launch

See `.vscode/tasks.json` and `.vscode/launch.json` for an example configuration.

### Debugging Flask API with breakpoints

1. Set breakpoints in `backend/get_model_limit_balances.py` or helper modules under `backend/helpers/`.
2. Press `F5`.
3. Confirm debugger attach on port `5678`.
4. Refresh the dashboard or call API endpoints.

## Testing (Playwright MCP)

Use Playwright MCP for browser-driven UI testing with either Codex or GitHub Copilot.

1. Install Playwright MCP globally:

```powershell
npm i -g @playwright/mcp
```

2. Start Chrome with remote debugging:

```powershell
Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" "--remote-debugging-port=9222"
Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" "--remote-debugging-port=9223"
```

3. Codex setup (`C:\Users\mmcin\.codex\config.toml`):

```toml
[mcp_servers.playwright]
command = "C:\\Users\\mmcin\\.codex\\playwright-mcp-cdp-first.cmd"
args = []

[mcp_servers.playwright.env]
NPM_CONFIG_OFFLINE = "false"
HTTP_PROXY = ""
HTTPS_PROXY = ""
ALL_PROXY = ""
```

`C:\Users\mmcin\.codex\playwright-mcp-cdp-first.cmd` runs CDP-first (`9223`) and falls back to managed browser if CDP is unavailable.

4. GitHub Copilot setup (`C:\Users\mmcin\AppData\Roaming\Code - Insiders\User\mcp.json`):

```json
"microsoft/playwright-mcp": {
  "type": "stdio",
  "command": "C:\\Users\\mmcin\\AppData\\Roaming\\npm\\playwright-mcp.cmd",
  "args": [
    "--browser=chrome",
    "--cdp-endpoint=http://127.0.0.1:9222",
    "--output-dir=C:\\Users\\mmcin\\Downloads\\"
  ],
  "gallery": "https://api.mcp.github.com",
  "version": "0.0.1-seed"
}
```

5. Restart the client after config changes:
- Restart Codex after editing `~/.codex/config.toml`.
- Restart VS Code Insiders after editing `mcp.json`.

## Frontend Notes

- `useUsageDashboard` orchestrates OpenRouter, Copilot, and Codex data refreshes.
- `useApiResource` centralizes shared fetch state management.
- API URLs are centralized in `src/api/endpoints.js` and can be overridden with `VITE_API_BASE_URL`.

## Technologies

- React + Vite
- Chakra UI v3
- Recharts
- Flask + requests + flask-cors
- debugpy
