use tauri::{AppHandle, Manager};

use futures_util::StreamExt;
use std::cmp::min;
use std::fs::File;
use std::io::Write;

use crate::module::model_type_sbv2::ModelTypeStyleBertVits2;
use crate::module::sqlite::Sqlite;

#[derive(Debug, Clone, serde::Serialize)]
pub struct Progress {
    pub model_type: String,
    pub rate: f64,
    pub is_progress: bool,
}

pub struct StyleBertVits2VoiceModelDownloader {
    app_handle: AppHandle,
}
impl StyleBertVits2VoiceModelDownloader {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    #[tokio::main]
    pub async fn download(&self, model_type: ModelTypeStyleBertVits2) {
        let model_path: &str = &format!("resources/style-bert-vits/models/{}.sbv2", model_type.as_str());
        let path: &str = &self
            .app_handle
            .path_resolver()
            .resolve_resource(model_path)
            .unwrap()
            .to_string_lossy()
            .to_string();
        let url: &str = &format!(
            "https://lycoris-storage.wktk.dev/{}.sbv2",
            model_type.as_str()
        );
        let res = reqwest::get(url).await.unwrap();
        let total_size = res
            .content_length()
            .ok_or(format!("Failed to get content length from '{}'", url))
            .unwrap();

        let _ = &self.app_handle.emit_all(
            "downloadStyleBertVits2VoiceProgress",
            Progress {
                model_type: model_type.as_str().to_string(),
                rate: 0.0,
                is_progress: true,
            },
        );

        let mut file;
        let mut downloaded: u64 = 0;
        let mut stream = res.bytes_stream();

        println!("Seeking in file.");
        if std::path::Path::new(&path).exists() {
            println!("File exists. Removig...");
            let _ = std::fs::remove_file(&path);
        }
        file = File::create(&path)
            .or(Err(format!("Failed to create file '{}'", &path)))
            .unwrap();

        println!("Commencing transfer");
        let mut rate = 0.0;
        while let Some(item) = stream.next().await {
            let chunk = item
                .or(Err(format!("Error while downloading file")))
                .unwrap();
            file.write(&chunk)
                .or(Err(format!("Error while writing to file")))
                .unwrap();
            let new = min(downloaded + (chunk.len() as u64), total_size);
            downloaded = new;

            let current_rate = ((new as f64 * 100.0) / total_size as f64).round();
            if rate != current_rate {
                let _ = &self.app_handle.emit_all(
                    "downloadStyleBertVits2VoiceProgress",
                    Progress {
                        model_type: model_type.as_str().to_string(),
                        rate: current_rate,
                        is_progress: true,
                    },
                );
                rate = current_rate
            }
        }

        let _ = Sqlite::new().update_model_is_downloaded(model_type.as_str().to_string(), 1);

        let _ = &self.app_handle.emit_all(
            "downloadStyleBertVits2VoiceProgress",
            Progress {
                model_type: model_type.as_str().to_string(),
                rate,
                is_progress: false,
            },
        );
    }
}
