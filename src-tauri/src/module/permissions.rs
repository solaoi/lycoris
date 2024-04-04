extern crate objc;
extern crate objc_foundation;
extern crate objc_id;

use objc::{
    msg_send,
    runtime::{Class, Object},
    sel, sel_impl,
};
use objc_id::Id;

use core_graphics::access::ScreenCaptureAccess;
use tauri::{api::dialog::confirm, Window};

pub fn has_accessibility_permission() -> bool {
    let trusted = macos_accessibility_client::accessibility::application_is_trusted_with_prompt();
    return trusted;
}

pub fn has_microphone_permission(window: Window) -> bool {
    unsafe {
        let av_audio_session: Id<Object> =
            msg_send![Class::get("AVAudioSession").unwrap(), sharedInstance];
        let permission_status: i32 = msg_send![av_audio_session, recordPermission];
        const AVAUDIO_SESSION_RECORD_PERMISSION_GRANTED: i32 = 1735552628;
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
            confirm(Some(&window),"システム設定の\"セキュリティとプライバシー\"設定で、このアプリケーションへのアクセスを許可してください。", "\"Lycoris.app\"からマイクにアクセスしようとしています。",func);
        }
        return trusted;
    }
}

pub fn has_screen_capture_permission(window: Window) -> bool {
    let access = ScreenCaptureAccess::default();
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
        confirm(Some(&window),"システム設定の\"セキュリティとプライバシー\"設定で、このアプリケーションへのアクセスを許可してください。", "\"Lycoris.app\"から画面収録にアクセスしようとしています。",func);
    }
    return trusted;
}
