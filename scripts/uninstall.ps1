$ErrorActionPreference = "SilentlyContinue"

$InstallDir = Join-Path $env:LOCALAPPDATA "Programs\KVReader"
$DesktopShortcut = Join-Path $env:USERPROFILE "Desktop\KV reader.lnk"
$StartMenuShortcut = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\KV reader.lnk"
$UninstallRegKey = "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\KVReader"
$RunRegKey = "HKCU\Software\Microsoft\Windows\CurrentVersion\Run"

Get-Process -Name "KV reader", "kavara-text-to-voice" -ErrorAction SilentlyContinue | Stop-Process -Force

if (Test-Path $DesktopShortcut) { Remove-Item -Force $DesktopShortcut }
if (Test-Path $StartMenuShortcut) { Remove-Item -Force $StartMenuShortcut }

reg delete $UninstallRegKey /f 2>$null | Out-Null
foreach ($RunName in @("Kavara Text to Voice", "KV reader", "kavara-text-to-voice")) {
    reg delete $RunRegKey /v $RunName /f 2>$null | Out-Null
}

if (Test-Path $InstallDir) {
    Start-Sleep -Milliseconds 400
    Remove-Item -Recurse -Force $InstallDir
}

Write-Host "🗑️ KV reader has been completely uninstalled." -ForegroundColor Yellow
