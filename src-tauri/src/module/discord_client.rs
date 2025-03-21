use reqwest::{
    header::{HeaderMap, HeaderValue, CONTENT_TYPE},
    Client,
};
use serde_json::json;

use super::sqlite::Sqlite;

pub struct DiscordClient {
    webhook_url: String,
}

impl DiscordClient {
    pub fn new() -> Self {
        let sqlite = Sqlite::new();
        let webhook_url = sqlite.select_discord_webhook_url().unwrap();

        Self { webhook_url }
    }

    pub async fn send_message(&self, message: String) -> Result<String, String> {
        let client = Client::new();

        let mut headers = HeaderMap::new();
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

        let post_body = json!({
            "content": message,
        });

        let response = client
            .post(self.webhook_url.as_str())
            .headers(headers)
            .json(&post_body)
            .send()
            .await
            .map_err(|e| e.to_string())?;
        let status = response.status();

        if status == 204 {
            Ok("success".to_string())
        } else {
            Err(format!(
                "failed: {}",
                response.text().await.unwrap_or("unknown error".to_string())
            ))
        }
    }
}
