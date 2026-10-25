use std::env;
use std::fs;
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use std::process::Command;

use serde::Serialize;

const CREATE_NO_WINDOW_FLAG: u32 = 0x08000000;
const INSTALL_FOLDER_NAME: &str = "KVReader";
const INSTALLED_BINARY_NAME: &str = "KV reader.exe";
const SHORTCUT_FILE_NAME: &str = "KV reader.lnk";
const UNINSTALL_REGISTRY_KEY: &str =
    r"HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\KVReader";

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppInstallationStatus {
    pub is_installed: bool,
    pub install_directory: String,
    pub installed_executable_path: String,
    pub has_desktop_shortcut: bool,
    pub has_start_menu_shortcut: bool,
}

fn resolve_install_directory() -> PathBuf {
    let base_local_app_data = env::var("LOCALAPPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."));
    base_local_app_data
        .join("Programs")
        .join(INSTALL_FOLDER_NAME)
}

fn resolve_desktop_shortcut_path() -> PathBuf {
    let user_profile = env::var("USERPROFILE")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."));
    user_profile.join("Desktop").join(SHORTCUT_FILE_NAME)
}

fn resolve_start_menu_shortcut_path() -> PathBuf {
    let app_data = env::var("APPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."));
    app_data
        .join("Microsoft")
        .join("Windows")
        .join("Start Menu")
        .join("Programs")
        .join(SHORTCUT_FILE_NAME)
}

pub fn check_installation_status() -> AppInstallationStatus {
    let install_dir = resolve_install_directory();
    let installed_exe = install_dir.join(INSTALLED_BINARY_NAME);
    let desktop_shortcut = resolve_desktop_shortcut_path();
    let start_menu_shortcut = resolve_start_menu_shortcut_path();

    let has_desktop_shortcut = desktop_shortcut.exists();
    let has_start_menu_shortcut = start_menu_shortcut.exists();
    let is_installed =
        installed_exe.exists() && (has_desktop_shortcut || has_start_menu_shortcut);

    AppInstallationStatus {
        is_installed,
        install_directory: install_dir.to_string_lossy().into_owned(),
        installed_executable_path: installed_exe.to_string_lossy().into_owned(),
        has_desktop_shortcut,
        has_start_menu_shortcut,
    }
}

pub fn install_app_for_current_user() -> Result<AppInstallationStatus, String> {
    let current_exe = env::current_exe()
        .map_err(|error| format!("Unable to locate running executable: {error}"))?;
    let install_dir = resolve_install_directory();
    let target_exe = install_dir.join(INSTALLED_BINARY_NAME);

    fs::create_dir_all(&install_dir)
        .map_err(|error| format!("Unable to create installation folder: {error}"))?;

    let is_same_executable = current_exe
        .canonicalize()
        .ok()
        .zip(target_exe.canonicalize().ok())
        .map(|(source, target)| source == target)
        .unwrap_or(false);

    if !is_same_executable {
        fs::copy(&current_exe, &target_exe)
            .map_err(|error| format!("Unable to copy application executable: {error}"))?;
    }

    let desktop_shortcut = resolve_desktop_shortcut_path();
    let start_menu_shortcut = resolve_start_menu_shortcut_path();

    create_windows_shortcut(&target_exe, &desktop_shortcut)?;
    create_windows_shortcut(&target_exe, &start_menu_shortcut)?;
    register_windows_uninstaller(&install_dir, &target_exe)?;

    Ok(check_installation_status())
}

pub fn uninstall_app_for_current_user() -> Result<(), String> {
    let desktop_shortcut = resolve_desktop_shortcut_path();
    let start_menu_shortcut = resolve_start_menu_shortcut_path();
    let install_dir = resolve_install_directory();

    if desktop_shortcut.exists() {
        let _ = fs::remove_file(&desktop_shortcut);
    }

    if start_menu_shortcut.exists() {
        let _ = fs::remove_file(&start_menu_shortcut);
    }

    remove_windows_registry_entries();
    schedule_install_directory_removal(&install_dir)?;

    Ok(())
}

fn create_windows_shortcut(target_exe: &PathBuf, shortcut_path: &PathBuf) -> Result<(), String> {
    let target_str = target_exe.to_string_lossy().replace('\'', "''");
    let shortcut_str = shortcut_path.to_string_lossy().replace('\'', "''");
    let working_dir_str = target_exe
        .parent()
        .unwrap_or(target_exe.as_path())
        .to_string_lossy()
        .replace('\'', "''");

    let powershell_script = format!(
        "$shell = New-Object -ComObject WScript.Shell; \
         $shortcut = $shell.CreateShortcut('{shortcut_str}'); \
         $shortcut.TargetPath = '{target_str}'; \
         $shortcut.WorkingDirectory = '{working_dir_str}'; \
         $shortcut.Description = 'KV reader — Floating Text to Speech Reader'; \
         $shortcut.IconLocation = '{target_str},0'; \
         $shortcut.Save();"
    );

    let output = Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", &powershell_script])
        .creation_flags(CREATE_NO_WINDOW_FLAG)
        .output()
        .map_err(|error| format!("Failed to invoke PowerShell for shortcut creation: {error}"))?;

    if !output.status.success() {
        let stderr_text = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Shortcut creation failed: {stderr_text}"));
    }

    Ok(())
}

fn register_windows_uninstaller(install_dir: &PathBuf, target_exe: &PathBuf) -> Result<(), String> {
    let install_dir_str = install_dir.to_string_lossy().into_owned();
    let target_exe_str = target_exe.to_string_lossy().into_owned();
    let uninstall_command = format!(
        "cmd.exe /C del /f /q \"%USERPROFILE%\\Desktop\\{SHORTCUT_FILE_NAME}\" & del /f /q \"%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\{SHORTCUT_FILE_NAME}\" & reg delete \"{UNINSTALL_REGISTRY_KEY}\" /f & rmdir /s /q \"{install_dir_str}\""
    );

    let registry_commands: &[(&str, &str)] = &[
        ("DisplayName", "KV reader"),
        ("Publisher", "Kavara"),
        ("DisplayVersion", "0.1.0"),
        ("DisplayIcon", &target_exe_str),
        ("InstallLocation", &install_dir_str),
        ("UninstallString", &uninstall_command),
    ];

    for (value_name, value_data) in registry_commands {
        let _ = Command::new("reg")
            .args([
                "add",
                UNINSTALL_REGISTRY_KEY,
                "/v",
                value_name,
                "/t",
                "REG_SZ",
                "/d",
                value_data,
                "/f",
            ])
            .creation_flags(CREATE_NO_WINDOW_FLAG)
            .output();
    }

    Ok(())
}

fn remove_windows_registry_entries() {
    let _ = Command::new("reg")
        .args(["delete", UNINSTALL_REGISTRY_KEY, "/f"])
        .creation_flags(CREATE_NO_WINDOW_FLAG)
        .output();

    let run_key = r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run";
    for value_name in ["Kavara Text to Voice", "KV reader", "kavara-text-to-voice"] {
        let _ = Command::new("reg")
            .args(["delete", run_key, "/v", value_name, "/f"])
            .creation_flags(CREATE_NO_WINDOW_FLAG)
            .output();
    }
}

fn schedule_install_directory_removal(install_dir: &PathBuf) -> Result<(), String> {
    if !install_dir.exists() {
        return Ok(());
    }

    let install_dir_str = install_dir.to_string_lossy().into_owned();
    let cleanup_command = format!(
        "ping 127.0.0.1 -n 3 > NUL & rmdir /s /q \"{install_dir_str}\""
    );

    Command::new("cmd")
        .args(["/C", &cleanup_command])
        .creation_flags(CREATE_NO_WINDOW_FLAG)
        .spawn()
        .map_err(|error| format!("Failed to schedule directory cleanup: {error}"))?;

    Ok(())
}
