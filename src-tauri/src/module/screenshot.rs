use std::{collections::HashSet, path::PathBuf};

use chrono::Local;
use serde::{Deserialize, Serialize};
use tauri::{api::path::data_dir, AppHandle, Manager};
use xcap::Window;

use crate::BUNDLE_IDENTIFIER;

use super::sqlite::Sqlite;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppWindow {
    pub id: u32,
    pub title: String,
}

pub fn list_app_windows(app_name: String) -> Vec<AppWindow> {
    Window::all()
        .unwrap()
        .iter()
        .filter_map(|window| {
            if window.is_minimized()
                || window.title().is_empty()
                || window.title() == "Item-0"
                || window.app_name() != app_name
            {
                None
            } else {
                Some(AppWindow {
                    id: window.id(),
                    title: window.title().to_string(),
                })
            }
        })
        .collect()
}

pub fn list_apps() -> Vec<String> {
    let mut app_names = HashSet::new();
    for window in Window::all().unwrap().iter() {
        let app_name = window.app_name();
        if !window.is_minimized() {
            if !window.title().is_empty()
                && window.title() != "Item-0"
                && app_name != "コントロールセンター"
                && app_name != "Control Center"
                && app_name != "Lycoris"
                && app_name != "Window Server"
            {
                app_names.insert(app_name.to_string());
            }
        }
    }
    let mut app_names_vec: Vec<String> = app_names.into_iter().collect();
    app_names_vec.sort();
    app_names_vec
}

fn normalized(filename: &str) -> String {
    filename
        .replace("|", "")
        .replace("\\", "")
        .replace(":", "")
        .replace("/", "")
}

pub fn screenshot(id: u32, note_id: u64, app_handle: AppHandle) -> bool {
    let windows = Window::all().unwrap();
    let window = windows
        .iter()
        .filter_map(|w| if id != w.id() { None } else { Some(w) })
        .collect::<Vec<_>>()
        .pop();

    if let Some(window) = window {
        let image = window.capture_image().unwrap();

        let data_dir = data_dir().unwrap_or(PathBuf::from("./"));
        let now = &Local::now().timestamp();
        let image_path = data_dir.join(BUNDLE_IDENTIFIER.to_string()).join(&format!(
            "{}-{}.png",
            normalized(window.title()),
            now.to_string()
        ));
        let image_path_clone = image_path.clone();

        image.save(image_path).unwrap();

        let speech = Sqlite::new().save_speech(
            "screenshot".to_string(),
            *now as u64,
            image_path_clone.to_str().unwrap().to_string(),
            "".to_string(),
            "manual".to_string(),
            "manual".to_string(),
            note_id,
        );

        app_handle
            .emit_all("screenshotTaken", speech.unwrap())
            .unwrap();

        true
    } else {
        false
    }
}
