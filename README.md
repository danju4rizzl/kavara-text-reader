# Kavara Text to Voice (`kavara-text-to-voice`)

A lightweight, always-on-top, transparent glassmorphic Windows text-to-speech floating pill built with **Tauri v2**, **React 18 + TypeScript**, and **Bun**.

---

## Features

- **Borderless Transparent Floating Pill:** Draggable anywhere on screen (`data-tauri-drag-region`), stays always on top, and hides from the Windows taskbar.
- **Global Shortcut (`Ctrl + Alt + S`):** Highlight text in any application and press `Ctrl + Alt + S` to automatically copy the selection and read it aloud using the native Windows speech engine (SAPI/WinRT).
- **Stop Shortcut (`Ctrl + Alt + X`) & Quick Action Button:** Stop active speech at any time via hotkey or the pill's `▶ / ◼` button.
- **Expandable Settings & Usage Guide (`⚙️` / `?`):** Configure Windows Startup (`tauri-plugin-autostart`), Always-on-Top window pinning, Widget Opacity, Reading Speed, Voice Pitch, Voice Volume, and Selection Copy Delay, or browse the built-in interactive Usage Guide.

---

## Where to Find the Production Installer (.exe)

Once the project is compiled with `bun run tauri:build`, you can find the ready-to-use installer files in `src-tauri/target/release/`:

| File Type | Location | Description |
| :--- | :--- | :--- |
| **Windows NSIS Installer (`.exe`)** | `src-tauri/target/release/bundle/nsis/Kavara Text to Voice_0.1.0_x64-setup.exe` | Standard Windows setup wizard installer with desktop shortcut. |
| **Windows MSI Installer (`.msi`)** | `src-tauri/target/release/bundle/msi/Kavara Text to Voice_0.1.0_x64_en-US.msi` | Enterprise Windows installer package. |
| **Standalone Portable (`.exe`)** | `src-tauri/target/release/kavara-text-to-voice.exe` | Portable executable that runs without installation. |

---

## Prerequisites

Ensure the following tools are installed on your Windows machine:

1. **Bun**: JavaScript runtime & package manager ([bun.sh](https://bun.sh)).
2. **Rust Toolchain (`cargo` & `rustc`)**:
   - Install via PowerShell:
     ```powershell
     winget install Rustlang.Rustup
     ```
     *(Or download from [rustup.rs](https://rustup.rs))*
   - Choose default option `1` during installation.
3. **Microsoft C++ Build Tools**:
   - Required by Rust on Windows (Visual Studio Build Tools with the *Desktop development with C++* workload).
4. **WebView2**:
   - Pre-installed by default on Windows 10 (version 1803+) and Windows 11.

---

## Step-by-Step Walkthrough

### Step 1: Install Project Dependencies

Open PowerShell in the project root directory and run:

```powershell
bun install
```

### Step 2: Verify Rust & Cargo in PATH

Ensure `cargo` is available in your active terminal:

```powershell
cargo --version
```

If you see `'cargo' is not recognized` or `failed to run 'cargo metadata'`, add Rust's bin directory to your PATH:

```powershell
$env:PATH += ";$env:USERPROFILE\.cargo\bin"
cargo --version
```

> **Note:** Restart your terminal or VS Code window after installing Rust so the updated system PATH is recognized.

### Step 3: Run in Development Mode

To launch the native desktop application with hot reload:

```powershell
bun run tauri:dev
```

*This starts the Vite dev server on port `1420` and opens the transparent floating pill window.*

If you only want to preview the React user interface in your web browser (without desktop APIs):

```powershell
bun run dev
```

Then navigate to `http://localhost:1420`.

### Step 4: Build the Standalone Production Installer

To compile the native Windows executable and generate the setup `.exe`:

```powershell
bun run tauri:build
```

> **Important Difference:**
> - `bun run build`: Only compiles the React web frontend into `dist/`. It does **not** create an `.exe`.
> - `bun run tauri:build`: Compiles the React frontend **and** the native Rust backend, producing the standalone installer.

### Step 5: Install and Run the App

Once `bun run tauri:build` completes, locate the installer:

```text
src-tauri/target/release/bundle/nsis/Kavara Text to Voice_0.1.0_x64-setup.exe
```

Double-click the `.exe` to install and launch **Kavara Text to Voice**.

---

## Troubleshooting

### 1. `failed to run 'cargo metadata' ... program not found`
- **Cause:** Rust is either not installed or `%USERPROFILE%\.cargo\bin` is missing from your system `PATH`.
- **Fix:** Install Rust via `winget install Rustlang.Rustup` or append `$env:USERPROFILE\.cargo\bin` to your environment PATH, then restart your terminal.

### 2. DevTools 404 Errors on Port 5500 (`Live Server`)
- **Cause:** Serving the project root via VS Code Live Server (`http://127.0.0.1:5500`) looks for assets at `/assets/...` instead of `/dist/assets/...`.
- **Fix:** Do not use Live Server. Use `bun run dev` (which serves from port `1420`) for browser testing or `bun run tauri:dev` for desktop testing.

---

## Project Structure

```text
kavara-text-to-voice/
├── docs/
│   └── agent-log.md                  # Development history and implementation notes
├── dist/                             # Compiled React frontend distribution
├── src/                              # React frontend source
│   ├── components/                   # UI components (SettingsPanel, UsageGuidePanel, etc.)
│   ├── hooks/                        # Custom hooks (useSpeechReader, useAppSettings, useAutostart)
│   ├── services/                     # Tauri IPC & localStorage persistence services
│   ├── types/                        # TypeScript interfaces and default settings
│   └── App.tsx                       # Root UI entrypoint
├── src-tauri/                        # Native Rust desktop backend
│   ├── capabilities/                 # Tauri v2 permissions & capabilities
│   ├── src/lib.rs                    # Rust backend commands & hotkey handlers
│   ├── target/release/bundle/nsis/   # Generated Windows installer (.exe)
│   └── tauri.conf.json               # Tauri window & bundle configuration
├── package.json                      # Project dependencies & scripts
└── vite.config.ts                    # Vite dev server configuration (port 1420)
```
