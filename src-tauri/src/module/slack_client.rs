use reqwest::{
    header::{HeaderMap, HeaderValue, CONTENT_TYPE},
    Client,
};
use serde_json::json;
use tauri::AppHandle;

use super::sqlite::Sqlite;

pub struct SlackClient {
    webhook_url: String,
}

impl SlackClient {
    pub fn new(app_handle: AppHandle) -> Self {
        let sqlite = Sqlite::new(app_handle.clone());
        let webhook_url = sqlite.select_slack_webhook_url().unwrap();

        Self { webhook_url }
    }

    pub async fn send_message(&self, message: String) -> Result<String, String> {
        let client = Client::new();

        let mut headers = HeaderMap::new();
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

        let post_body = json!({
            "text": message,
        });

        let response = client
            .post(self.webhook_url.as_str())
            .headers(headers)
            .json(&post_body)
            .send()
            .await
            .map_err(|e| e.to_string())?;
        let status = response.status();

        if status == 200 {
            Ok("success".to_string())
        } else {
            Err(format!(
                "failed: {}",
                response.text().await.unwrap_or("unknown error".to_string())
            ))
        }
    }
}
