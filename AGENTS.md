# KV reader (`kavara-text-to-voice`) — Project Rules & Architecture Guide

This repository contains **KV reader** (`kavara-text-to-voice`), a lightweight, floating, always-on-top Windows text-to-speech desktop widget built with **Tauri v2**, **Rust**, **React 18 (TypeScript)**, **Vite**, and **Bun**.

## 1. Package Manager & Build Commands

- **Always use Bun** (`bun install`, `bun run dev`, `bun run build`, `bun run tauri:dev`, `bun run tauri:build`, `bunx`). Never use `npm`, `npx`, or `yarn`.
- **Frontend vs. Desktop Build:**
  - `bun run build`: Runs `tsc && vite build` to compile the React frontend into `dist/`.
  - `bun run tauri:build`: Compiles the Rust backend and bundles the Windows NSIS installer (`src-tauri/target/release/bundle/nsis/`).
  - `bun run app:install` / `bun run app:uninstall`: Runs PowerShell scripts in `scripts/` for per-user installation/uninstallation.

## 2. Brand & Naming Conventions

- **Frontend Display Name:** Always use the centralized constant `APP_DISPLAY_NAME` (`"KV reader"`) from `src/types/settings.ts` for UI titles, tooltips, and user-facing text. Never hardcode duplicate brand strings across React components.
- **Package & Crate Identifiers:**
  - Package name: `kavara-text-to-voice` (`package.json`, `src-tauri/Cargo.toml`)
  - Rust library crate: `kavara_text_to_voice_lib`
  - Tauri app identifier: `com.kavara.texttovoice`
- **Brand Assets & Theme:**
  - Primary logo source: `app-logo-v1.png` (purple speech-bubble + headphone emblem).
  - Tauri bundle & tray icons live in `src-tauri/icons/` (`32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.png`, `icon.ico`).
  - Frontend status/brand badge is rendered via `src/components/StatusIndicator.tsx` (`brand-status-badge`).

## 3. Window Behavior & UX Architecture

- **Default Placement:** On startup (`initialize_main_window_placement` in `src-tauri/src/lib.rs`), the compact floating pill (`245x50` logical px) is positioned at the **bottom-center** of the active monitor directly above the Windows taskbar (`56px` logical bottom clearance).
- **Upward Expansion:** When toggling the expanded Settings / Usage Guide panel (`360x490` logical px) via `set_widget_expanded`, `adjust_window_bounds_for_expansion` ensures the window expands **upward** when docked near the taskbar so it never clips off-screen.
- **Immediate Dragging:**
  - Keep `data-tauri-drag-region` on non-interactive container elements and `handleDragStart` (`onMouseDown`) in `src/App.tsx`.
  - Ensure window focus is established (`currentWindow.setFocus()` before `startDragging()`) so first-click dragging works immediately without clicking a button first.
  - Interactive elements (`input`, `button`, `label`, `select`, `a`) must remain excluded from drag initiation.
- **Capabilities:** Any new `WebviewWindow` API called from the frontend must have its corresponding permission explicitly added in `src-tauri/capabilities/default.json`.

## 4. Codebase Structure & Clean Code Standards

- **Frontend (`src/`):**
  - `src/components/`: Single-responsibility presentational components (`StatusIndicator`, `SpeechActionButton`, `SettingsGearButton`, `SettingsPanel`, `UsageGuidePanel`, `AutostartToggle`).
  - `src/hooks/`: Stateful lifecycle hooks (`useSpeechReader`, `useAppSettings`, `useAutostart`, `useAppInstallation`).
  - `src/services/`: Tauri IPC and persistence abstractions (`speechService`, `settingsService`, `installationService`). Keep `invoke()` calls inside `src/services/` rather than calling them directly inside React components.
  - `src/types/`: Shared TypeScript interfaces and constants (`settings.ts`).
  - `src/styles/widget.css`: Glassmorphic styling, CSS Houdini `@property --border-angle` animations, and layout rules.
- **Backend (`src-tauri/src/`):**
  - `lib.rs`: Speech synthesis state (`SpeechEngineState` wrapping `tts::Tts`), global shortcuts (`Ctrl+Alt+S` speak selection via `enigo` copy simulation, `Ctrl+Alt+X` stop speech), window sizing/positioning, and system tray setup.
  - `installer.rs`: Per-user Windows installation (`%LOCALAPPDATA%\Programs\KVReader`), Desktop/Start Menu `.lnk` shortcut creation, and Registry uninstaller management.
- **Clean Code Principles (Robert C. Martin):**
  - **Meaningful Names:** Use intention-revealing, pronounceable, searchable names. Avoid generic names (`data`, `info`, `temp`).
  - **Single Responsibility (SRP):** Keep functions small, focused on a single task, and operating at one level of abstraction.
  - **DRY:** Extract duplicated logic into cohesive helpers or services.
  - **Self-Documenting Code:** Write expressive code; use comments only to explain *why*, never *what* or *how*.
  - **Standard Error Handling:** Separate business logic from error recovery and logging.

## 5. Mandatory Documentation & Response Workflow

1. **Always Log Updates in `docs/agent-log.md`:**
   - Every task must append a new timestamped entry (`YYYY-MM-DD HH:MM:SS +01:00 — Title`) to `docs/agent-log.md` containing:
     - **What was implemented:** 1–2 sentences summarizing the changes.
     - **Problem & Solution:** 1–2 sentences explaining the issue and how it was resolved.
2. **Bug Fixes in `@docs/...`:**
   - When asked to update a `@docs/...` file after fixing a bug, include the issue and how it was fixed in a brief sentence.
3. **End-of-Task Deliverables:**
   - Provide a concise summary of changes with clickable file/symbol links.
   - Provide a Git commit message with a title (max 70 characters) and bulleted description.
   - Provide **3 possible next steps** based on the completed work (never suggest features already implemented unless proposing a specific refactoring or enhancement).
