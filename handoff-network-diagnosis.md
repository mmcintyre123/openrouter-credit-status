<analysis>
The user cannot reach the Vite dashboard from another computer at http://192.168.1.40:5173/. On the host machine, diagnostics showed the app stack is configured correctly for LAN access and responds locally on the LAN IP. The unresolved issue is on the other computer or the network path between machines: timeout from client, client Wi-Fi network category/firewall/VPN/router isolation, or inability to route to 192.168.1.40. Excluded unrelated app UI/code context except paths that establish intended LAN behavior.
</analysis>

<handoff>
## Goal
Diagnose why the other computer times out when opening http://192.168.1.40:5173/ and confirm whether the client machine/network can reach the host machine’s Vite dev server.

## Relevant Context
- Host project is `C:\Users\Matthew\MyApps\vscode workspaces\openrouter-credit-status`.
- Host machine IP is currently `192.168.1.40` on Ethernet.
- Host Vite server is listening on `0.0.0.0:5173` and was started with `--host 0.0.0.0 --port 5173`.
- Host Flask API is listening on `0.0.0.0:4000`; `http://192.168.1.40:4000/api/openrouter/balance` returned `200 OK` locally.
- Host Windows network profile for Ethernet is `Private`, and inbound firewall rules include Allow rules for Node/Python on Private.
- User’s home Wi-Fi SSIDs are `KIWI-9W15` and `KIWI-9W15-5G`; user wants only these home Wi-Fi profiles set to Private, not all Wi-Fi.

## Key Details
On the host, `Invoke-WebRequest -UseBasicParsing http://192.168.1.40:5173/` returned `StatusCode: 200`. `netstat -ano -p tcp | Select-String ':5173|:4000'` showed `TCP 0.0.0.0:5173 LISTENING` and `TCP 0.0.0.0:4000 LISTENING`. `Get-CimInstance Win32_Process -Filter "ProcessId = 10444"` showed Vite command line: `"node" "...vite.js" --host 0.0.0.0 --port 5173`.

From the other computer, run `Test-NetConnection 192.168.1.40 -Port 5173`, `Test-NetConnection 192.168.1.40 -Port 4000`, `ping 192.168.1.40`, and `Get-NetConnectionProfile`. If connected to `KIWI-9W15` or `KIWI-9W15-5G` and the profile is Public, use `Set-NetConnectionProfile -Name "KIWI-9W15" -NetworkCategory Private` or `Set-NetConnectionProfile -Name "KIWI-9W15-5G" -NetworkCategory Private` as Administrator.

## Warnings
Do not use `Set-NetConnectionProfile -InterfaceAlias "Wi-Fi"` unless intentionally changing the currently active Wi-Fi network; prefer `-Name` for the specific SSID profile.
</handoff>
