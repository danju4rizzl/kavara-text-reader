# Agent Implementation Log

## 2026-09-27 15:18:00 +01:00 — Initial Tauri v2 + React Floating TTS Desktop App (`Audio Float`)

- **What was implemented:** Built the complete **Audio Float (`reader-bubble`)** Windows desktop application using **Tauri v2**, **React 18 (TypeScript)**, and **Bun**, featuring a transparent, borderless, always-on-top glassmorphic floating pill widget (`data-tauri-drag-region`), global shortcut listeners (`Ctrl+Alt+S` to copy & speak active selection, `Ctrl+Alt+X` to stop speech), simulated `Ctrl+C` selection capture via `enigo`, native Windows SAPI speech synthesis via `tts`, and a one-click Windows Startup toggle via `tauri-plugin-autostart`.
- **Problem & Solution:** A lightweight native Windows text-to-speech floating reader was needed without Electron's memory overhead, and Tauri v2's updated plugin/capability system required explicit window drag permissions (`core:window:allow-start-dragging`), 3-argument shortcut event handlers (`ShortcutState::Pressed`), and modifier key release handling (`Alt`/`S`) before simulating `Ctrl+C`; solved by configuring `src-tauri/capabilities/default.json`, releasing held shortcut modifiers prior to `Enigo` copy simulation in `src-tauri/src/lib.rs`, and structuring the React UI into clean, single-responsibility hooks and services.

## 2026-09-27 19:30:00 +01:00 — Production Installer Location & Cargo Toolchain Path Walkthrough

- **What was implemented:** Located the generated production `.exe` and `.msi` installer bundles, clarified the distinction between `bun run build` (Vite web bundle) and `bun run tauri:build` (native Windows desktop executable/installer), and provided a step-by-step resolution for the missing `cargo` toolchain PATH and DevTools Live Server 404 errors.
- **Problem & Solution:** The user was unable to locate the `.exe` after running `bun run build`, received 404 errors on Live Server port 5500, and encountered `failed to run cargo metadata: program not found` on `bun run tauri dev`; solved by identifying the compiled NSIS installer in `src-tauri/target/release/bundle/nsis/Audio Float_0.1.0_x64-setup.exe` and providing explicit terminal/PATH setup steps for the Rust toolchain.

## 2026-09-27 19:35:00 +01:00 — Step-by-Step Guide in README.md

- **What was implemented:** Updated `README.md` with a comprehensive step-by-step walkthrough covering prerequisites, dependency installation with Bun, Cargo PATH configuration, development mode startup, production installer builds, and troubleshooting tips.
- **Problem & Solution:** Instructions for locating the compiled installer, distinguishing between Vite frontend builds and Tauri desktop packages, and setting up the Rust toolchain were missing from the project documentation; solved by adding a clear table of build artifacts, step-by-step terminal instructions, and troubleshooting guidance directly in `README.md`.

## 2026-09-27 20:31:00 +01:00 — Expandable Settings Panel, Gear Icon & Interactive Usage Guide

- **What was implemented:** Added a gear icon and quick-guide icon to the compact floating pill that dynamically expand the Tauri window into a tabbed **Settings** and **Usage Guide** view, moving the Windows Startup toggle into Settings alongside new controls for Reading Speed (`0.5x–2.5x`), Voice Pitch (`0.5x–1.5x`), Voice Volume (`0%–100%`), Always-on-Top window pinning, Widget Opacity (`40%–100%`), Selection Copy Delay (`50ms–250ms`), a live "Test Voice" preview button, and a Voice Engine roadmap card for upcoming offline and ElevenLabs voices.
- **Problem & Solution:** Displaying only the startup checkbox directly on the tiny `165x50` pill limited configuration options and left new users without in-app onboarding for global shortcuts; solved by adding Rust Tauri commands (`set_widget_expanded`, `update_speech_settings`, `set_window_always_on_top`, `speak_sample_text`) to dynamically resize the frameless window and synchronize speech parameters with the native `tts` engine while persisting preferences via `settingsService.ts`.

## 2026-09-27 21:16:00 +01:00 — Project & Application Rebrand to `Kavara Text to Voice` (`kavara-text-to-voice`)

- **What was implemented:** Renamed the entire project, Tauri product name, Rust crate/library (`kavara-text-to-voice` / `kavara_text_to_voice_lib`), package manifest (`package.json`), HTML document title, UI labels, tooltips, sample speech preview text, `localStorage` persistence key, and `README.md` documentation to **Kavara Text to Voice** (`kavara-text-to-voice`).
- **Problem & Solution:** The project and UI still carried legacy placeholder names (`Audio Float`, `kavara-reader`, `reader-bubble`), causing inconsistencies across package manifests, window titles, and UI headers; solved by unifying all configuration manifests (`package.json`, `Cargo.toml`, `tauri.conf.json`, `default.json`), Rust entrypoints (`main.rs`, `lib.rs`), React components, and documentation under `Kavara Text to Voice` (`kavara-text-to-voice`) and widening the compact pill window (`245px`) so the full brand name fits cleanly on a single line.

## 2026-10-24 11:19:00 +01:00 — Update Frontend Display Text to `KV reader`

- **What was implemented:** Extracted a centralized `APP_DISPLAY_NAME = "KV reader"` constant in `src/types/settings.ts` and updated all frontend UI text, headers, tooltips, usage guide copy, sample preview utterance, and HTML document title from `"Kavara Text to Voice"` to `"KV reader"`.
- **Problem & Solution:** The full `"Kavara Text to Voice"` text on the floating frontend widget and expanded panel needed to be shortened to `"KV reader"` without scattering duplicate string literals across components; solved by defining `APP_DISPLAY_NAME` in `src/types/settings.ts` and referencing it across `App.tsx`, `SettingsPanel.tsx`, `AutostartToggle.tsx`, `UsageGuidePanel.tsx`, `CloseWindowButton.tsx`, and `index.html`.

## 2026-10-24 11:22:00 +01:00 — Remove Help Guide Button from Compact Floating Widget

- **What was implemented:** Removed the question-mark Help Guide icon button and `onOpenGuide` handler from `src/components/SettingsGearButton.tsx` and updated `src/App.tsx` so the compact floating pill displays only the Settings gear button.
- **Problem & Solution:** Having both a Help Guide (`?`) button and a Settings (`⚙️`) button on the compact floating pill added visual clutter when the Usage Guide is already accessible via the tab inside the expanded panel; solved by simplifying `SettingsGearButton` to render a single Settings gear trigger.

## 2026-10-24 11:27:00 +01:00 — Smooth Animated Border Line on Application Hover

- **What was implemented:** Added a CSS `@property --border-angle` and `border-line-orbit` keyframe animation with a masked `conic-gradient` `::before` pseudo-element on `.widget` and `.expanded-panel` in `src/styles/widget.css` so a luminous cyan-to-emerald line smoothly orbits the application border when hovered.
- **Problem & Solution:** Users needed clear, polished visual hover feedback along the perimeter of the floating pill and expanded panel without layout shifts or clipping; solved by using a CSS Houdini angle property (`--border-angle`), `mask-composite: exclude` border ring masking, and `animation-play-state` transitions on `.widget:hover::before` and `.expanded-panel:hover::before`.

## 2026-10-24 11:34:00 +01:00 — Restrict Hover Border Animation to Main Compact Pill & Single-Pass Orbit

- **What was implemented:** Scoped the animated `::before` border line strictly to `.widget` (removing it from `.expanded-panel`) and replaced the infinite loop with a single-pass `@keyframes border-line-orbit-once` animation (`1.1s ease-in-out 1 forwards`) in `src/styles/widget.css`.
- **Problem & Solution:** The hover border animation was previously running infinitely on both the main compact pill and the expanded settings panel; solved by removing the pseudo-element and hover glow from `.expanded-panel` and configuring `.widget:hover::before` to run exactly 1 rotation (`0deg` to `360deg`) before fading out.

## 2026-10-24 11:46:00 +01:00 — Active Speaking Sky-Blue Orbiting Border Line on Compact Widget

- **What was implemented:** Added the `.widget--speaking` state class to the compact widget in `src/App.tsx` when `isSpeaking` is true, and implemented `.widget--speaking`, `.widget--speaking::before`, and `@keyframes border-line-speaking-orbit` in `src/styles/widget.css` to automatically display a continuous sky-blue (`#38bdf8`) orbiting border line and ambient glow during active speech playback.
- **Problem & Solution:** Users needed clear peripheral visual feedback on the floating widget while speech synthesis is actively reading aloud even when the cursor is not hovering over the pill; solved by conditionally applying `.widget--speaking` in `App.tsx` and driving a continuous sky-blue `conic-gradient` border orbit while preserving the single-pass emerald hover animation when idle (`.widget:not(.widget--speaking):hover::before`).

## 2026-10-24 12:46:00 +01:00 — Selectable System Voices Dropdown in SettingsPanel

- **What was implemented:** Added the `list_system_voices` Tauri command and `SystemVoiceOption` mapping (`id`, `name`, `language`, `gender`) in `src-tauri/src/lib.rs`, extended `SpeechConfiguration` with `selected_voice_id` and `apply_voice_by_id` (`engine.set_voice`), persisted `selectedVoiceId` via `settingsService.ts` and `useAppSettings.ts`, and rendered a glassmorphic System Voice `<select>` dropdown inside `src/components/SettingsPanel.tsx`.
- **Problem & Solution:** Users could previously only use the default Windows SAPI voice without choosing among other installed system voices; solved by enumerating installed voices via `Tts::voices()` in Rust, synchronizing the chosen `selectedVoiceId` with `Tts::set_voice()`, and exposing an interactive voice selector dropdown in `SettingsPanel`.

## 2026-10-24 14:25:00 +01:00 — Fix `bun run tauri:build` Failure Caused by Stale Directory Rename Cache

- **What was implemented:** Investigated the `bun run tauri:build` failure, purged the stale Cargo build script and fingerprint caches (`src-tauri/target/{release,debug}/{build,.fingerprint}`), and recompiled the release executable (`src-tauri/target/release/kavara-text-to-voice.exe`).
- **Problem & Solution:** Renaming the workspace folder from `kavara-voice-to-text` to `kavara-text-reader` left hardcoded absolute paths to `\\?\C:\Users\pc\dev\others\kavara-voice-to-text\...` inside Tauri's cached build script outputs (`target/release/build/tauri-*/out/permissions/...`), causing `build-script-build` to exit with `os error 3 (The system cannot find the path specified)`; solved by clearing the stale `build` and `.fingerprint` directories under `src-tauri/target` and rebuilding the release target.

## 2026-10-24 14:46:00 +01:00 — Install & Uninstall Features, Windows Taskbar Icon & System Tray Exit Menu

- **What was implemented:** Created `src-tauri/src/installer.rs` (handling per-user installation to `%LOCALAPPDATA%\Programs\KVReader\KV reader.exe`, Desktop & Start Menu `.lnk` shortcuts, Windows "Installed Apps" registry registration, and full uninstallation cleanup), enabled `"skipTaskbar": false` in `src-tauri/tauri.conf.json` so the running icon appears in the Windows Taskbar, added a native System Tray icon (`setup_system_tray` in `src-tauri/src/lib.rs`) with "Show KV reader", "Stop Speaking", "Install KV reader", "Uninstall KV reader", and "Exit / Close KV reader" menu actions, added `installationService.ts`, `useAppInstallation.ts`, and in-app Install / Uninstall / Exit controls in `src/components/SettingsPanel.tsx`, and added `scripts/install.ps1` and `scripts/uninstall.ps1` (`bun run app:install` / `bun run app:uninstall`).
- **Problem & Solution:** Because `skipTaskbar` was previously `true` and there was no system tray icon or in-app installer/uninstaller, users could not see the running app in the taskbar, exit it from the taskbar/tray, or easily install/uninstall it; solved by enabling the Windows Taskbar entry (`skipTaskbar: false`), registering a native Tauri `TrayIconBuilder` context menu with complete exit (`app.exit(0)`), and providing both in-app and CLI one-click install/uninstall flows.

## 2026-10-25 00:59:00 +01:00 — Default Bottom-Center Placement Above Taskbar & Immediate First-Click Dragging

- **What was implemented:** Added `initialize_main_window_placement`, `position_window_at_bottom_center`, and `adjust_window_bounds_for_expansion` in `src-tauri/src/lib.rs` to place the floating widget at the bottom-center of the screen directly above the Windows taskbar by default and expand upward when opening settings; also enabled immediate first-click window dragging by focusing the window on startup (`set_focus` in Rust, `"focus": true` in `tauri.conf.json`, `window.focus()` and `currentWindow.setFocus()` before `startDragging()` in `src/App.tsx`, and `"core:window:allow-set-focus"` / `"core:window:allow-set-position"` in `src-tauri/capabilities/default.json`).
- **Problem & Solution:** The widget defaulted to the top-left corner of the screen and required clicking a button to activate the WebView2 surface before dragging worked, plus expanding the settings panel while near the bottom edge would push the panel under the taskbar; solved by calculating the active monitor's physical dimensions and scale factor on startup to center the pill above the taskbar, anchoring bottom-docked expansion upward, and explicitly focusing both the native window and WebView immediately upon launch and drag initiation.

## 2026-10-25 01:04:00 +01:00 — Comprehensive `.gitignore` for GitHub Repository Readiness

- **What was implemented:** Updated `.gitignore` with comprehensive ignore rules covering Node/Bun dependencies (`node_modules/`), Vite/TypeScript build outputs and caches (`dist/`, `dist-ssr/`, `.vite/`, `*.tsbuildinfo`), Rust/Tauri compilation and generated artifacts (`src-tauri/target/`, `src-tauri/gen/`, `src-tauri/WixTools/`), environment secrets (`.env`, `.env.*` while preserving `!.env.example`), IDE workspace settings (`.vscode/*`, `.idea/`), and OS metadata (`Thumbs.db`, `Desktop.ini`, `.DS_Store`).
- **Problem & Solution:** Preparing the codebase to push to GitHub required ensuring no heavy Rust/Vite build outputs, environment secrets, editor caches, or OS-generated files could accidentally be committed; solved by organizing a complete, categorized `.gitignore` tailored for Tauri v2, Rust, Vite, React, and Bun on Windows.

## 2026-10-25 01:41:00 +01:00 — Integrate `app-logo-v1.png` Across System Tray, Taskbar, Executable Icons & Frontend Brand Badge

- **What was implemented:** Generated aspect-ratio-preserved square PNGs (`32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.png`) and a multi-resolution 32-bit ARGB Windows `icon.ico` (`16px` to `256px`) from `app-logo-v1.png` in `src-tauri/icons/`, registered all icon sizes in `src-tauri/tauri.conf.json` and `index.html`, and upgraded `StatusIndicator.tsx`, `App.tsx`, and `src/styles/widget.css` into a live **Brand Status Badge** (`brand-status-badge`) that displays `app-logo-v1.png` with an overlaid corner status dot (emerald when listening, sky-blue pulsing glow when speaking) on both the compact floating pill and the expanded panel header.
- **Problem & Solution:** The application previously used generic placeholder icons in the Windows Taskbar and System Tray and only showed a plain dot on the frontend widget without brand identity; solved by converting `app-logo-v1.png` into padded square multi-size Tauri icons for the `.exe`, Taskbar, and System Tray while combining the logo and live status dot into a cohesive, space-efficient avatar badge in `StatusIndicator.tsx`.

## 2026-10-25 11:44:00 +01:00 — Add Workspace Project Rules (`AGENTS.md`) via Antigravity Customizations

- **What was implemented:** Created `AGENTS.md` at the repository root codifying KV reader's package manager rules (Bun), brand & icon conventions (`APP_DISPLAY_NAME`, `app-logo-v1.png`), window placement & drag UX architecture (bottom-center taskbar clearance, upward settings expansion, first-click focus/drag), React/Rust Clean Code separation of concerns, and mandatory `docs/agent-log.md` documentation rules.
- **Problem & Solution:** Project-specific architectural conventions and Tauri v2 capability/window constraints needed to be version-controlled and automatically loaded for any agent session working in the repository; solved by creating a standalone hierarchical `AGENTS.md` rule file at the workspace root following the Antigravity Customization System specification.
