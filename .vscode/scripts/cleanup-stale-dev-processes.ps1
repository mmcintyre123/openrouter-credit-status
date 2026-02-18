[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ExpectedByPort = @{
    4000 = @("python")
    5173 = @("node")
    5678 = @("python")
    9223 = @("chrome", "msedge")
}

$IssueReasons = @{}
$MaxKillPasses = 2
$PostPassDelayMs = 400

function Write-Step {
    <#
    .SYNOPSIS
    Writes a standardized cleanup log line.

    .PARAMETER Message
    Message text to display.
    #>
    param([string]$Message)
    Write-Host "[cleanup] $Message"
}

function Get-TargetPorts {
    <#
    .SYNOPSIS
    Returns the configured target ports in ascending order.
    #>
    return $ExpectedByPort.Keys | Sort-Object
}

function Get-ExpectedProcessNames {
    <#
    .SYNOPSIS
    Returns the allowed process names for a target port.

    .PARAMETER Port
    Target port number.
    #>
    param([int]$Port)
    return $ExpectedByPort[$Port]
}

function Get-ListenerKey {
    <#
    .SYNOPSIS
    Builds a stable dictionary key for a port/process pair.

    .PARAMETER Port
    Target port number.

    .PARAMETER ProcessId
    Process ID bound to the target port.
    #>
    param(
        [int]$Port,
        [int]$ProcessId
    )
    return "${Port}:$ProcessId"
}

function Set-IssueReason {
    <#
    .SYNOPSIS
    Stores the latest issue reason for a listener.

    .PARAMETER Port
    Target port number.

    .PARAMETER ProcessId
    Process ID bound to the target port.

    .PARAMETER Reason
    Conflict reason such as unsafe target or kill failed.
    #>
    param(
        [int]$Port,
        [int]$ProcessId,
        [string]$Reason
    )
    $IssueReasons[(Get-ListenerKey -Port $Port -ProcessId $ProcessId)] = $Reason
}

function Clear-IssueReason {
    <#
    .SYNOPSIS
    Clears a previously recorded issue reason for a listener.

    .PARAMETER Port
    Target port number.

    .PARAMETER ProcessId
    Process ID bound to the target port.
    #>
    param(
        [int]$Port,
        [int]$ProcessId
    )
    $key = Get-ListenerKey -Port $Port -ProcessId $ProcessId
    if ($IssueReasons.ContainsKey($key)) {
        $IssueReasons.Remove($key)
    }
}

function Get-ProcessName {
    <#
    .SYNOPSIS
    Resolves a process name from PID, returning unknown on lookup failure.

    .PARAMETER ProcessId
    Process ID to resolve.
    #>
    param([int]$ProcessId)
    try {
        return (Get-Process -Id $ProcessId -ErrorAction Stop).ProcessName.ToLowerInvariant()
    } catch {
        return "unknown"
    }
}

function Test-ExpectedProcess {
    <#
    .SYNOPSIS
    Tests whether a process name is allowed for a target port.

    .PARAMETER ProcessName
    Candidate process name.

    .PARAMETER ExpectedProcessNames
    Allowed process names for the target port.
    #>
    param(
        [string]$ProcessName,
        [string[]]$ExpectedProcessNames
    )
    return $ExpectedProcessNames -contains $ProcessName
}

function ConvertFrom-NetstatLine {
    <#
    .SYNOPSIS
    Parses a netstat LISTENING line into a listener object.

    .PARAMETER Line
    Raw netstat output line.
    #>
    param([string]$Line)

    $parts = ($Line -split "\s+") | Where-Object { $_ -ne "" }
    if ($parts.Count -lt 5) {
        return $null
    }

    $localAddress = $parts[1]
    $state = $parts[3]
    $pidRaw = $parts[4]

    if ($state -ne "LISTENING") {
        return $null
    }

    $portMatch = [regex]::Match($localAddress, ":(\d+)$")
    if (-not $portMatch.Success) {
        return $null
    }
    $port = [int]$portMatch.Groups[1].Value

    if ($pidRaw -notmatch "^\d+$") {
        return $null
    }

    return [PSCustomObject]@{
        Port = $port
        Pid  = [int]$pidRaw
    }
}

function Get-ListeningSnapshot {
    <#
    .SYNOPSIS
    Returns a deduplicated snapshot of all LISTENING sockets from netstat.
    #>
    $listeners = @()
    $rawLines = netstat -ano

    foreach ($line in $rawLines) {
        if ($line -notmatch "\bLISTENING\b") {
            continue
        }

        $listener = ConvertFrom-NetstatLine -Line $line
        if ($null -ne $listener) {
            $listeners += $listener
        }
    }

    return $listeners | Sort-Object Port, Pid -Unique
}

function Get-ListenersForPort {
    <#
    .SYNOPSIS
    Filters a listener snapshot down to one target port.

    .PARAMETER Snapshot
    Snapshot returned by Get-ListeningSnapshot.

    .PARAMETER Port
    Target port number.
    #>
    param(
        [object[]]$Snapshot,
        [int]$Port
    )
    return @($Snapshot | Where-Object { $_.Port -eq $Port })
}

function Write-PortStatus {
    <#
    .SYNOPSIS
    Logs whether a target port is clear or which PIDs are listening.

    .PARAMETER Port
    Target port number.

    .PARAMETER Listeners
    Listener objects for the target port.
    #>
    param(
        [int]$Port,
        [object[]]$Listeners
    )

    if ($Listeners.Count -eq 0) {
        Write-Step "Port $Port is already clear."
        return
    }

    $pidList = ($Listeners | ForEach-Object { $_.Pid }) -join ", "
    Write-Step "Port $Port listeners: $pidList"
}

function Invoke-ListenerCleanup {
    <#
    .SYNOPSIS
    Applies safe kill logic to one listener on one target port.

    .PARAMETER Port
    Target port number.

    .PARAMETER ProcessId
    Listener process ID to evaluate.

    .PARAMETER ExpectedProcessNames
    Allowed process names for this port.
    #>
    param(
        [int]$Port,
        [int]$ProcessId,
        [string[]]$ExpectedProcessNames
    )

    $processName = Get-ProcessName -ProcessId $ProcessId

    if (-not (Test-ExpectedProcess -ProcessName $processName -ExpectedProcessNames $ExpectedProcessNames)) {
        Set-IssueReason -Port $Port -ProcessId $ProcessId -Reason "unsafe target"
        Write-Step "Skipped PID $ProcessId ($processName) on port $Port; expected: $($ExpectedProcessNames -join '/')."
        return
    }

    try {
        Stop-Process -Id $ProcessId -Force -ErrorAction Stop
        Clear-IssueReason -Port $Port -ProcessId $ProcessId
        Write-Step "Killed PID $ProcessId ($processName) on port $Port."
    } catch {
        Set-IssueReason -Port $Port -ProcessId $ProcessId -Reason "kill failed"
        Write-Step "Failed to kill PID $ProcessId ($processName) on port ${Port}: $($_.Exception.Message)"
    }
}

function Invoke-KillPass {
    <#
    .SYNOPSIS
    Executes one cleanup pass across all target ports.

    .PARAMETER PassNumber
    Current pass number.

    .PARAMETER TotalPasses
    Configured maximum number of passes.
    #>
    param(
        [int]$PassNumber,
        [int]$TotalPasses
    )

    Write-Step "Kill pass $PassNumber/$TotalPasses starting."
    $snapshot = @(Get-ListeningSnapshot)

    foreach ($port in @(Get-TargetPorts)) {
        $listeners = @(Get-ListenersForPort -Snapshot $snapshot -Port $port)
        Write-PortStatus -Port $port -Listeners $listeners

        if ($listeners.Count -eq 0) {
            continue
        }

        $expectedProcessNames = Get-ExpectedProcessNames -Port $port
        foreach ($listener in $listeners) {
            Invoke-ListenerCleanup `
                -Port $port `
                -ProcessId $listener.Pid `
                -ExpectedProcessNames $expectedProcessNames
        }
    }

    Write-Step "Kill pass $PassNumber/$TotalPasses complete."
}

function Get-ConflictReason {
    <#
    .SYNOPSIS
    Resolves the final reason for a listener that remains after cleanup.

    .PARAMETER Port
    Target port number.

    .PARAMETER ProcessId
    Remaining process ID.

    .PARAMETER ProcessName
    Resolved process name for ProcessId.

    .PARAMETER ExpectedProcessNames
    Allowed process names for the target port.
    #>
    param(
        [int]$Port,
        [int]$ProcessId,
        [string]$ProcessName,
        [string[]]$ExpectedProcessNames
    )

    $key = Get-ListenerKey -Port $Port -ProcessId $ProcessId
    if ($IssueReasons.ContainsKey($key)) {
        return $IssueReasons[$key]
    }

    if (Test-ExpectedProcess -ProcessName $ProcessName -ExpectedProcessNames $ExpectedProcessNames) {
        return "still listening"
    }

    return "unsafe target"
}

function Get-RemainingConflicts {
    <#
    .SYNOPSIS
    Returns all listeners still occupying target ports with reason metadata.
    #>
    $conflicts = @()
    $snapshot = @(Get-ListeningSnapshot)

    foreach ($port in @(Get-TargetPorts)) {
        $expectedProcessNames = Get-ExpectedProcessNames -Port $port
        $listeners = @(Get-ListenersForPort -Snapshot $snapshot -Port $port)

        foreach ($listener in $listeners) {
            $processId = $listener.Pid
            $processName = Get-ProcessName -ProcessId $processId
            $reason = Get-ConflictReason `
                -Port $port `
                -ProcessId $processId `
                -ProcessName $processName `
                -ExpectedProcessNames $expectedProcessNames

            $conflicts += [PSCustomObject]@{
                Port    = $port
                PID     = $processId
                Process = $processName
                Reason  = $reason
            }
        }
    }

    return $conflicts | Sort-Object Port, PID -Unique
}

Write-Step "Starting stale dev process cleanup."
Write-Step "Target ports: $((@(Get-TargetPorts) -join ', '))"

$remaining = @()
for ($pass = 1; $pass -le $MaxKillPasses; $pass++) {
    Invoke-KillPass -PassNumber $pass -TotalPasses $MaxKillPasses
    Start-Sleep -Milliseconds $PostPassDelayMs

    $remaining = @(Get-RemainingConflicts)
    if ($remaining.Count -eq 0) {
        Write-Step "Cleanup successful. All target ports are clear."
        exit 0
    }

    if ($pass -lt $MaxKillPasses) {
        Write-Step "Conflicts remain after pass $pass. Retrying matched targets."
    }
}

Write-Step "Cleanup failed. Remaining listeners:"
$remaining | Format-Table -AutoSize | Out-String | Write-Host
exit 1
