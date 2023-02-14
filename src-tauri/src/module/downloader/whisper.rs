use tauri::{AppHandle, Manager};

use futures_util::StreamExt;
use std::cmp::min;
use std::fs::File;
use std::io::{Seek, Write};

use crate::module::model_type_whisper::ModelTypeWhisper;

#[derive(Debug, Clone, serde::Serialize)]
pub struct Progress {
    pub model_type: String,
    pub rate: f64,
    pub is_progress: bool,
}

pub struct WhisperModelDownloader {
    app_handle: AppHandle,
}
impl WhisperModelDownloader {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    #[tokio::main]
    pub async fn download(&self, model_type: ModelTypeWhisper) {
        let model_path: &str = &format!("resources/whisper/ggml-{}.bin", model_type.as_str());
        let path: &str = &self
            .app_handle
            .path_resolver()
            .resolve_resource(model_path)
            .unwrap()
            .to_string_lossy()
            .to_string();
        let url: &str = &format!(
            "https://huggingface.co/datasets/ggerganov/whisper.cpp/resolve/main/ggml-{}.bin",
            model_type.as_str()
        );
        let res = reqwest::get(url).await.unwrap();
        let total_size = res
            .content_length()
            .ok_or(format!("Failed to get content length from '{}'", url))
            .unwrap();

        let _ = &self.app_handle.emit_all(
            "downloadWhisperProgress",
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
            println!("File exists. Resuming.");
            file = std::fs::OpenOptions::new()
                .read(true)
                .append(true)
                .open(&path)
                .unwrap();

            let file_size = std::fs::metadata(&path).unwrap().len();
            file.seek(std::io::SeekFrom::Start(file_size)).unwrap();
            downloaded = file_size;
        } else {
            println!("Fresh file..");
            file = File::create(&path)
                .or(Err(format!("Failed to create file '{}'", &path)))
                .unwrap();
        }

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
                    "downloadWhisperProgress",
                    Progress {
                        model_type: model_type.as_str().to_string(),
                        rate: current_rate,
                        is_progress: true,
                    },
                );
                rate = current_rate
            }
        }

        let _ = &self.app_handle.emit_all(
            "downloadWhisperProgress",
            Progress {
                model_type: model_type.as_str().to_string(),
                rate,
                is_progress: false,
            },
        );
    }
}
