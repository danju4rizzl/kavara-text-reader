mod installer;

use std::sync::Mutex;
use std::thread;
use std::time::Duration;

use enigo::{Direction, Enigo, Key, Keyboard, Settings};
use installer::{
    check_installation_status, install_app_for_current_user, uninstall_app_for_current_user,
    AppInstallationStatus,
};
use serde::{Deserialize, Serialize};
use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{
    AppHandle, Emitter, LogicalSize, Manager, PhysicalPosition, PhysicalSize, Position, Size,
    WebviewWindow,
};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use tts::{Gender, Tts, Voice};

const SPEECH_STATUS_EVENT: &str = "speech-status-changed";
const SPEAK_SHORTCUT_COMBINATION: &str = "ctrl+alt+s";
const STOP_SHORTCUT_COMBINATION: &str = "ctrl+alt+x";
const MODIFIER_RELEASE_DELAY_MS: u64 = 55;
const DEFAULT_CLIPBOARD_DELAY_MS: u64 = 95;
const MAX_PREVIEW_CHARACTERS: usize = 48;

const COMPACT_WINDOW_WIDTH: f64 = 245.0;
const COMPACT_WINDOW_HEIGHT: f64 = 50.0;
const EXPANDED_WINDOW_WIDTH: f64 = 360.0;
const EXPANDED_WINDOW_HEIGHT: f64 = 490.0;
const TASKBAR_BOTTOM_CLEARANCE_LOGICAL_PX: f64 = 56.0;
const SCREEN_EDGE_PADDING_LOGICAL_PX: f64 = 12.0;

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct SpeechConfiguration {
    speech_rate: f32,
    speech_pitch: f32,
    speech_volume: f32,
    clipboard_delay_ms: u64,
    selected_voice_id: Option<String>,
}

impl Default for SpeechConfiguration {
    fn default() -> Self {
        Self {
            speech_rate: 1.0,
            speech_pitch: 1.0,
            speech_volume: 1.0,
            clipboard_delay_ms: DEFAULT_CLIPBOARD_DELAY_MS,
            selected_voice_id: None,
        }
    }
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SystemVoiceOption {
    id: String,
    name: String,
    language: String,
    gender: Option<String>,
}

struct SpeechEngineState {
    tts_engine: Mutex<Option<Tts>>,
    configuration: Mutex<SpeechConfiguration>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct SpeechStatusPayload {
    is_speaking: bool,
    preview_text: Option<String>,
}

fn emit_speech_status(app: &AppHandle, is_speaking: bool, preview_text: Option<String>) {
    let payload = SpeechStatusPayload {
        is_speaking,
        preview_text,
    };
    let _ = app.emit(SPEECH_STATUS_EVENT, payload);
}

fn build_preview_snippet(full_text: &str) -> String {
    let single_line = full_text.split_whitespace().collect::<Vec<_>>().join(" ");
    if single_line.chars().count() <= MAX_PREVIEW_CHARACTERS {
        return single_line;
    }
    let truncated: String = single_line.chars().take(MAX_PREVIEW_CHARACTERS).collect();
    format!("{}...", truncated)
}

fn simulate_copy_shortcut() -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|error| format!("Failed to initialize Enigo keyboard controller: {error}"))?;

    // Release Alt and S first in case the user is still holding Ctrl+Alt+S
    let _ = enigo.key(Key::Unicode('s'), Direction::Release);
    let _ = enigo.key(Key::Alt, Direction::Release);
    thread::sleep(Duration::from_millis(MODIFIER_RELEASE_DELAY_MS));

    let _ = enigo.key(Key::Control, Direction::Press);
    let _ = enigo.key(Key::Unicode('c'), Direction::Click);
    let _ = enigo.key(Key::Control, Direction::Release);

    Ok(())
}

fn read_trimmed_clipboard_text(app: &AppHandle) -> Option<String> {
    let raw_text = app.clipboard().read_text().ok()?;
    let trimmed_text = raw_text.trim().to_string();
    if trimmed_text.is_empty() {
        None
    } else {
        Some(trimmed_text)
    }
}

fn apply_configuration_to_engine(engine: &mut Tts, config: &SpeechConfiguration) {
    let clamped_rate = config
        .speech_rate
        .clamp(engine.min_rate(), engine.max_rate());
    let clamped_pitch = config
        .speech_pitch
        .clamp(engine.min_pitch(), engine.max_pitch());
    let clamped_volume = config
        .speech_volume
        .clamp(engine.min_volume(), engine.max_volume());

    let _ = engine.set_rate(clamped_rate);
    let _ = engine.set_pitch(clamped_pitch);
    let _ = engine.set_volume(clamped_volume);

    if let Some(ref target_voice_id) = config.selected_voice_id {
        if !target_voice_id.is_empty() {
            apply_voice_by_id(engine, target_voice_id);
        }
    }
}

fn apply_voice_by_id(engine: &mut Tts, target_voice_id: &str) {
    let Ok(installed_voices) = engine.voices() else {
        return;
    };

    if let Some(matching_voice) = installed_voices
        .into_iter()
        .find(|voice| voice.id() == target_voice_id)
    {
        let _ = engine.set_voice(&matching_voice);
    }
}

fn map_voice_to_option(voice: Voice) -> SystemVoiceOption {
    let gender_label = voice.gender().map(|gender| match gender {
        Gender::Male => "Male".to_string(),
        Gender::Female => "Female".to_string(),
    });

    SystemVoiceOption {
        id: voice.id(),
        name: voice.name(),
        language: voice.language().to_string(),
        gender: gender_label,
    }
}

fn read_current_configuration(app: &AppHandle) -> SpeechConfiguration {
    let state = app.state::<SpeechEngineState>();
    state
        .configuration
        .lock()
        .map(|guard| guard.clone())
        .unwrap_or_default()
}

fn speak_text_utterance(app: &AppHandle, text_to_speak: String) {
    let preview_snippet = build_preview_snippet(&text_to_speak);
    let current_config = read_current_configuration(app);
    let state = app.state::<SpeechEngineState>();

    let Ok(mut engine_guard) = state.tts_engine.lock() else {
        return;
    };

    if engine_guard.is_none() {
        *engine_guard = Tts::default().ok();
    }

    if let Some(ref mut engine) = *engine_guard {
        let _ = engine.stop();
        apply_configuration_to_engine(engine, &current_config);
        if engine.speak(text_to_speak, true).is_ok() {
            emit_speech_status(app, true, Some(preview_snippet));
        }
    }
}

#[tauri::command]
fn trigger_speak(app: AppHandle) {
    thread::spawn(move || {
        if simulate_copy_shortcut().is_err() {
            return;
        }

        let clipboard_delay_ms = read_current_configuration(&app)
            .clipboard_delay_ms
            .clamp(30, 500);
        thread::sleep(Duration::from_millis(clipboard_delay_ms));

        if let Some(selected_text) = read_trimmed_clipboard_text(&app) {
            speak_text_utterance(&app, selected_text);
        }
    });
}

#[tauri::command]
fn speak_clipboard(app: AppHandle) {
    thread::spawn(move || {
        if let Some(clipboard_text) = read_trimmed_clipboard_text(&app) {
            speak_text_utterance(&app, clipboard_text);
        }
    });
}

#[tauri::command]
fn speak_sample_text(app: AppHandle, text: String) {
    let trimmed_sample = text.trim().to_string();
    if trimmed_sample.is_empty() {
        return;
    }

    thread::spawn(move || {
        speak_text_utterance(&app, trimmed_sample);
    });
}

#[tauri::command]
fn stop_speaking(app: AppHandle) {
    let state = app.state::<SpeechEngineState>();
    if let Ok(mut engine_guard) = state.tts_engine.lock() {
        if let Some(ref mut engine) = *engine_guard {
            let _ = engine.stop();
        }
    }
    emit_speech_status(&app, false, None);
}

#[tauri::command]
fn list_system_voices(app: AppHandle) -> Vec<SystemVoiceOption> {
    let state = app.state::<SpeechEngineState>();
    let Ok(mut engine_guard) = state.tts_engine.lock() else {
        return Vec::new();
    };

    if engine_guard.is_none() {
        *engine_guard = Tts::default().ok();
    }

    let Some(ref engine) = *engine_guard else {
        return Vec::new();
    };

    engine
        .voices()
        .map(|voices| voices.into_iter().map(map_voice_to_option).collect())
        .unwrap_or_default()
}

#[tauri::command]
fn update_speech_settings(app: AppHandle, settings: SpeechConfiguration) {
    let state = app.state::<SpeechEngineState>();

    if let Ok(mut config_guard) = state.configuration.lock() {
        *config_guard = settings.clone();
    };

    if let Ok(mut engine_guard) = state.tts_engine.lock() {
        if let Some(ref mut engine) = *engine_guard {
            apply_configuration_to_engine(engine, &settings);
        }
    };
}

#[tauri::command]
fn set_window_always_on_top(app: AppHandle, always_on_top: bool) {
    if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.set_always_on_top(always_on_top);
    }
}

fn resolve_target_physical_size(
    window: &WebviewWindow,
    logical_width: f64,
    logical_height: f64,
) -> PhysicalSize<u32> {
    let scale_factor = window.scale_factor().unwrap_or(1.0);
    PhysicalSize::new(
        (logical_width * scale_factor).round() as u32,
        (logical_height * scale_factor).round() as u32,
    )
}

fn position_window_at_bottom_center(window: &WebviewWindow) {
    let Ok(Some(monitor)) = window
        .current_monitor()
        .or_else(|_| window.primary_monitor())
    else {
        return;
    };

    let monitor_position = monitor.position();
    let monitor_size = monitor.size();
    let scale_factor = monitor.scale_factor();
    let window_size = window
        .outer_size()
        .unwrap_or_else(|_| resolve_target_physical_size(window, COMPACT_WINDOW_WIDTH, COMPACT_WINDOW_HEIGHT));

    let bottom_clearance_px = (TASKBAR_BOTTOM_CLEARANCE_LOGICAL_PX * scale_factor).round() as i32;
    let target_x =
        monitor_position.x + ((monitor_size.width as i32 - window_size.width as i32) / 2);
    let target_y = monitor_position.y + monitor_size.height as i32
        - window_size.height as i32
        - bottom_clearance_px;

    let _ = window.set_position(Position::Physical(PhysicalPosition::new(
        target_x, target_y,
    )));
}

fn adjust_window_bounds_for_expansion(window: &WebviewWindow, expanded: bool) {
    let (target_logical_width, target_logical_height) = if expanded {
        (EXPANDED_WINDOW_WIDTH, EXPANDED_WINDOW_HEIGHT)
    } else {
        (COMPACT_WINDOW_WIDTH, COMPACT_WINDOW_HEIGHT)
    };

    let previous_position = window.outer_position().ok();
    let previous_size = window.outer_size().ok();
    let target_physical_size =
        resolve_target_physical_size(window, target_logical_width, target_logical_height);

    let _ = window.set_size(Size::Logical(LogicalSize::new(
        target_logical_width,
        target_logical_height,
    )));

    let (Some(current_pos), Some(prev_size)) = (previous_position, previous_size) else {
        return;
    };

    let Ok(Some(monitor)) = window
        .current_monitor()
        .or_else(|_| window.primary_monitor())
    else {
        return;
    };

    let monitor_pos = monitor.position();
    let monitor_size = monitor.size();
    let scale_factor = monitor.scale_factor();
    let edge_padding_px = (SCREEN_EDGE_PADDING_LOGICAL_PX * scale_factor).round() as i32;
    let taskbar_clearance_px = (TASKBAR_BOTTOM_CLEARANCE_LOGICAL_PX * scale_factor).round() as i32;

    let center_x = current_pos.x + (prev_size.width as i32 / 2);
    let mut next_x = center_x - (target_physical_size.width as i32 / 2);
    let min_x = monitor_pos.x + edge_padding_px;
    let max_x = monitor_pos.x + monitor_size.width as i32
        - target_physical_size.width as i32
        - edge_padding_px;
    if max_x >= min_x {
        next_x = next_x.clamp(min_x, max_x);
    }

    let min_y = monitor_pos.y + edge_padding_px;
    let max_usable_bottom_y =
        monitor_pos.y + monitor_size.height as i32 - taskbar_clearance_px;
    let prev_bottom_y = current_pos.y + prev_size.height as i32;

    let mut next_y = if expanded {
        if current_pos.y + target_physical_size.height as i32 > max_usable_bottom_y {
            prev_bottom_y - target_physical_size.height as i32
        } else {
            current_pos.y
        }
    } else {
        let was_anchored_near_bottom =
            (prev_bottom_y - max_usable_bottom_y).abs() <= taskbar_clearance_px;
        if was_anchored_near_bottom {
            prev_bottom_y - target_physical_size.height as i32
        } else {
            current_pos.y
        }
    };

    let max_y = max_usable_bottom_y - target_physical_size.height as i32;
    if max_y >= min_y {
        next_y = next_y.clamp(min_y, max_y);
    }

    let _ = window.set_position(Position::Physical(PhysicalPosition::new(next_x, next_y)));
}

#[tauri::command]
fn set_widget_expanded(app: AppHandle, expanded: bool) {
    if let Some(main_window) = app.get_webview_window("main") {
        adjust_window_bounds_for_expansion(&main_window, expanded);
    }
}

#[tauri::command]
fn get_installation_status() -> AppInstallationStatus {
    check_installation_status()
}

#[tauri::command]
fn install_application() -> Result<AppInstallationStatus, String> {
    install_app_for_current_user()
}

#[tauri::command]
fn uninstall_application(app: AppHandle) -> Result<(), String> {
    stop_speaking(app.clone());
    uninstall_app_for_current_user()?;
    app.exit(0);
    Ok(())
}

#[tauri::command]
fn quit_application(app: AppHandle) {
    stop_speaking(app.clone());
    app.exit(0);
}

fn focus_main_window(app: &AppHandle) {
    if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.show();
        let _ = main_window.unminimize();
        let _ = main_window.set_focus();
    }
}

fn setup_system_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let show_item = MenuItemBuilder::with_id("show_window", "Show KV reader").build(app)?;
    let stop_item =
        MenuItemBuilder::with_id("stop_speech", "Stop Speaking (Ctrl+Alt+X)").build(app)?;
    let install_item =
        MenuItemBuilder::with_id("install_app", "Install KV reader (Desktop & Start Menu)")
            .build(app)?;
    let uninstall_item =
        MenuItemBuilder::with_id("uninstall_app", "Uninstall KV reader").build(app)?;
    let quit_item = MenuItemBuilder::with_id("quit_app", "Exit / Close KV reader").build(app)?;
    let separator_top = PredefinedMenuItem::separator(app)?;
    let separator_bottom = PredefinedMenuItem::separator(app)?;

    let tray_menu = MenuBuilder::new(app)
        .items(&[
            &show_item,
            &stop_item,
            &separator_top,
            &install_item,
            &uninstall_item,
            &separator_bottom,
            &quit_item,
        ])
        .build()?;

    let mut tray_builder = TrayIconBuilder::with_id("kv-reader-tray")
        .tooltip("KV reader — Running")
        .menu(&tray_menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app_handle, event| match event.id().as_ref() {
            "show_window" => {
                focus_main_window(app_handle);
            }
            "stop_speech" => {
                stop_speaking(app_handle.clone());
            }
            "install_app" => {
                let _ = install_app_for_current_user();
            }
            "uninstall_app" => {
                stop_speaking(app_handle.clone());
                let _ = uninstall_app_for_current_user();
                app_handle.exit(0);
            }
            "quit_app" => {
                quit_application(app_handle.clone());
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                focus_main_window(tray.app_handle());
            }
        });

    if let Some(default_icon) = app.default_window_icon().cloned() {
        tray_builder = tray_builder.icon(default_icon);
    }

    let _ = tray_builder.build(app)?;
    Ok(())
}

fn register_global_shortcuts(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let speak_shortcut: Shortcut = SPEAK_SHORTCUT_COMBINATION.parse()?;
    let stop_shortcut: Shortcut = STOP_SHORTCUT_COMBINATION.parse()?;

    let speak_handle = app.handle().clone();
    app.global_shortcut()
        .on_shortcut(speak_shortcut, move |_app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                trigger_speak(speak_handle.clone());
            }
        })?;

    let stop_handle = app.handle().clone();
    app.global_shortcut()
        .on_shortcut(stop_shortcut, move |_app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                stop_speaking(stop_handle.clone());
            }
        })?;

    Ok(())
}

fn initialize_main_window_placement(app: &tauri::App) {
    if let Some(main_window) = app.get_webview_window("main") {
        position_window_at_bottom_center(&main_window);
        let _ = main_window.show();
        let _ = main_window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let initial_tts_engine = Tts::default().ok();

    tauri::Builder::default()
        .manage(SpeechEngineState {
            tts_engine: Mutex::new(initial_tts_engine),
            configuration: Mutex::new(SpeechConfiguration::default()),
        })
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            initialize_main_window_placement(app);
            register_global_shortcuts(app)?;
            setup_system_tray(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            trigger_speak,
            speak_clipboard,
            speak_sample_text,
            stop_speaking,
            list_system_voices,
            update_speech_settings,
            set_window_always_on_top,
            set_widget_expanded,
            get_installation_status,
            install_application,
            uninstall_application,
            quit_application
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
