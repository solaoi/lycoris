use core_graphics::access::ScreenCaptureAccess;
use objc2::{class, msg_send, runtime::AnyObject};
use tauri::{api::dialog::confirm, Window};

use super::sqlite::Sqlite;

pub fn has_accessibility_permission() -> bool {
    let trusted = macos_accessibility_client::accessibility::application_is_trusted_with_prompt();
    return trusted;
}

pub fn has_microphone_permission(window: Window) -> bool {
    unsafe {
        let av_audio_session: *mut AnyObject =
            msg_send![class!(AVAudioApplication), sharedInstance];
        let permission_status: i64 = msg_send![av_audio_session, recordPermission];
        const AVAUDIO_SESSION_RECORD_PERMISSION_GRANTED: i64 = 1735552628;
        let trusted = permission_status == AVAUDIO_SESSION_RECORD_PERMISSION_GRANTED;
        if !trusted {
            let func = |ok: bool| {
                if ok {
                    std::process::Command::new("open")
                    .arg(
                        "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone",
                    )
                    .spawn()
                    .expect("failed to open system preferences");
                }
            };
            confirm(Some(&window),"システム設定の\"プライバシーとセキュリティ\"設定で、このアプリケーションへのアクセスを許可してください。", "\"Lycoris.app\"からマイクにアクセスしようとしています。",func);
        }
        return trusted;
    }
}

pub fn has_screen_capture_permission(window: Window) -> bool {
    let sqlite = Sqlite::new();
    let has_accessed_screen_capture_permission = sqlite
        .select_has_accessed_screen_capture_permission()
        .unwrap();
    let access = ScreenCaptureAccess::default();
    if has_accessed_screen_capture_permission == "has_accessed" {
        let trusted = access.preflight();
        if !trusted {
            let func = |ok: bool| {
                if ok {
                    std::process::Command::new("open")
                    .arg(
                        "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture",
                    )
                    .spawn()
                    .expect("failed to open system preferences");
                }
            };
            confirm(Some(&window),"システム設定の\"プライバシーとセキュリティ\"設定で、このアプリケーションへのアクセスを許可してください。", "\"Lycoris.app\"から画面収録にアクセスしようとしています。",func);
        }
        return trusted;
    } else {
        sqlite
            .update_has_accessed_screen_capture_permission()
            .unwrap();
        return access.request();
    }
}
