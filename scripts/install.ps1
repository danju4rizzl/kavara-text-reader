$ErrorActionPreference = "Stop"

$InstallDir = Join-Path $env:LOCALAPPDATA "Programs\KVReader"
$TargetExe = Join-Path $InstallDir "KV reader.exe"
$DesktopShortcut = Join-Path $env:USERPROFILE "Desktop\KV reader.lnk"
$StartMenuShortcut = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\KV reader.lnk"
$UninstallRegKey = "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\KVReader"

$SourceExe = Join-Path $PSScriptRoot "..\src-tauri\target\release\kavara-text-to-voice.exe"
if (-not (Test-Path $SourceExe)) {
    Write-Host "Release executable not found at $SourceExe. Building release binary..." -ForegroundColor Cyan
    $env:Path += ";$env:USERPROFILE\.cargo\bin"
    bun run build
    cargo build --release --manifest-path (Join-Path $PSScriptRoot "..\src-tauri\Cargo.toml")
}

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
Copy-Item -Force -Path $SourceExe -Destination $TargetExe

$WshShell = New-Object -ComObject WScript.Shell
foreach ($ShortcutPath in @($DesktopShortcut, $StartMenuShortcut)) {
    $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = $TargetExe
    $Shortcut.WorkingDirectory = $InstallDir
    $Shortcut.Description = "KV reader — Floating Text to Speech Reader"
    $Shortcut.IconLocation = "$TargetExe,0"
    $Shortcut.Save()
}

$UninstallCmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$PSScriptRoot\uninstall.ps1`""
reg add $UninstallRegKey /v DisplayName /t REG_SZ /d "KV reader" /f | Out-Null
reg add $UninstallRegKey /v Publisher /t REG_SZ /d "Kavara" /f | Out-Null
reg add $UninstallRegKey /v DisplayVersion /t REG_SZ /d "0.1.0" /f | Out-Null
reg add $UninstallRegKey /v DisplayIcon /t REG_SZ /d $TargetExe /f | Out-Null
reg add $UninstallRegKey /v InstallLocation /t REG_SZ /d $InstallDir /f | Out-Null
reg add $UninstallRegKey /v UninstallString /t REG_SZ /d $UninstallCmd /f | Out-Null

Write-Host "✅ KV reader installed successfully!" -ForegroundColor Green
Write-Host "   • Location:       $TargetExe"
Write-Host "   • Desktop Icon:   $DesktopShortcut"
Write-Host "   • Start Menu:     $StartMenuShortcut"
