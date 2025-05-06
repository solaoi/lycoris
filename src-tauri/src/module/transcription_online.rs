use tokio::{fs::File, io::AsyncReadExt};

use super::sqlite::Sqlite;

use crossbeam_channel::Receiver;

use reqwest::{
    header::{HeaderMap, HeaderValue, AUTHORIZATION},
    multipart, Client,
};
use serde_json::Value;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, serde::Serialize)]
pub struct TraceCompletion {}

pub struct TranscriptionOnline {
    app_handle: AppHandle,
    sqlite: Sqlite,
    speaker_language: String,
    transcription_accuracy: String,
    note_id: u64,
    token: String,
}

impl TranscriptionOnline {
    pub fn new(
        app_handle: AppHandle,
        transcription_accuracy: String,
        speaker_language: String,
        note_id: u64,
    ) -> Self {
        let sqlite = Sqlite::new(app_handle.clone());
        let token = sqlite.select_whisper_token().unwrap();
        Self {
            app_handle,
            sqlite,
            speaker_language,
            transcription_accuracy,
            note_id,
            token,
        }
    }

    pub fn start(&mut self, stop_convert_rx: Receiver<()>, use_no_vosk_queue_terminate_mode: bool) {
        while Self::convert(self).is_ok() {
            if use_no_vosk_queue_terminate_mode {
                let vosk_speech = self.sqlite.select_vosk(self.note_id);
                if vosk_speech.is_err() {
                    self.app_handle
                        .clone()
                        .emit("traceCompletion", TraceCompletion {})
                        .unwrap();
                    break;
                }
            }
            if stop_convert_rx.try_recv().is_ok() {
                let vosk_speech = self.sqlite.select_vosk(self.note_id);
                if vosk_speech.is_err() {
                    self.app_handle
                        .clone()
                        .emit("traceCompletion", TraceCompletion {})
                        .unwrap();
                } else {
                    self.app_handle
                        .clone()
                        .emit("traceUnCompletion", TraceCompletion {})
                        .unwrap();
                }
                break;
            }
        }
    }

    #[tokio::main]
    async fn request(
        speaker_language: String,
        file_path: String,
        token: String,
        is_translate: bool,
    ) -> Result<String, Box<dyn std::error::Error>> {
        let url = if is_translate {
            "https://api.openai.com/v1/audio/translations"
        } else {
            "https://api.openai.com/v1/audio/transcriptions"
        };

        let model = "whisper-1";

        let client = Client::new();

        let mut headers = HeaderMap::new();
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", token))?,
        );
        let mut file = File::open(file_path).await?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer).await?;

        let part_file = multipart::Part::bytes(buffer)
            .file_name("test.wav")
            .mime_str("audio/wav")?;

        let part_model = multipart::Part::text(model);
        let language = if speaker_language.starts_with("en-us")
            || speaker_language.starts_with("small-en-us")
        {
            "en"
        } else if speaker_language.starts_with("cn") || speaker_language.starts_with("small-cn") {
            "zh"
        } else if speaker_language.starts_with("small-ko") {
            "ko"
        } else if speaker_language.starts_with("fr") || speaker_language.starts_with("small-fr") {
            "fr"
        } else if speaker_language.starts_with("de") || speaker_language.starts_with("small-de") {
            "de"
        } else if speaker_language.starts_with("ru") || speaker_language.starts_with("small-ru") {
            "ru"
        } else if speaker_language.starts_with("es") || speaker_language.starts_with("small-es") {
            "es"
        } else if speaker_language.starts_with("small-pt") {
            "pt"
        } else if speaker_language.starts_with("small-tr") {
            "tr"
        } else if speaker_language.starts_with("vn") || speaker_language.starts_with("small-vn") {
            "vi"
        } else if speaker_language.starts_with("it") || speaker_language.starts_with("small-it") {
            "it"
        } else if speaker_language.starts_with("small-nl") {
            "nl"
        } else if speaker_language.starts_with("small-ca") {
            "ca"
        } else if speaker_language.starts_with("uk") || speaker_language.starts_with("small-uk") {
            "uk"
        } else if speaker_language.starts_with("small-sv") {
            "sv"
        } else if speaker_language.starts_with("hi") || speaker_language.starts_with("small-hi") {
            "hi"
        } else if speaker_language.starts_with("small-cs") {
            "cs"
        } else if speaker_language.starts_with("small-pl") {
            "pl"
        } else {
            "ja"
        };
        let part_language = multipart::Part::text(language);
        let prompt = if is_translate {
            "This is an audio in English. Please transcribe it accurately with appropriate punctuation."
        } else {
            if language == "en" {
                "This is an audio in English. Please transcribe it accurately with appropriate punctuation."
            } else if language == "zh" {
                "这是中文音频。请使用适当的标点符号准确记录。"
            } else if language == "ko" {
                "이것은 한국어 음성입니다. 적절한 문장부호를 사용하여 정확하게 받아써 주세요."
            } else if language == "fr" {
                "Ceci est un audio en français. Veuillez le transcrire avec précision en utilisant la ponctuation appropriée."
            } else if language == "de" {
                "Dies ist eine deutsche Audioaufnahme. Bitte transkribieren Sie sie genau mit der entsprechenden Interpunktion."
            } else if language == "ru" {
                "Это аудио на русском языке. Пожалуйста, сделайте точную расшифровку с правильной пунктуацией."
            } else if language == "es" {
                "Este es un audio en español. Por favor, transcríbalo con precisión usando la puntuación adecuada."
            } else if language == "pt" {
                "Este é um áudio em português. Por favor, transcreva-o com precisão usando a pontuação adequada."
            } else if language == "tr" {
                "Bu bir Türkçe ses kaydıdır. Lütfen uygun noktalama işaretlerini kullanarak doğru bir şekilde yazıya dökün."
            } else if language == "vi" {
                "Đây là bản ghi âm tiếng Việt. Vui lòng ghi chép chính xác với dấu câu phù hợp."
            } else if language == "it" {
                "Questo è un audio in italiano. Si prega di trascriverlo accuratamente con la punteggiatura appropriata."
            } else if language == "nl" {
                "Dit is een Nederlandse audio. Gelieve deze nauwkeurig te transcriberen met de juiste interpunctie."
            } else if language == "ca" {
                "Aquest és un àudio en català. Si us plau, transcriviu-lo amb precisió utilitzant la puntuació adequada."
            } else if language == "uk" {
                "Це аудіо українською мовою. Будь ласка, зробіть точний транскрипт з правильною пунктуацією."
            } else if language == "sv" {
                "Detta är ett svenskt ljudklipp. Var god transkribera det noggrant med lämplig interpunktion."
            } else if language == "hi" {
                "यह हिंदी में ऑडियो है। कृपया उचित विराम चिह्नों का उपयोग करते हुए सटीक प्रतिलेखन करें।"
            } else if language == "cs" {
                "Toto je audio v češtině. Prosím, přepište jej přesně s použitím vhodné interpunkce."
            } else if language == "pl" {
                "To jest nagranie w języku polskim. Proszę dokonać dokładnej transkrypcji z odpowiednią interpunkcją."
            } else if language == "ja" {
                "これは日本語の音声です。適切な句読点を用いて正確に書き起こしてください。"
            } else {
                "This is an audio in English. Please transcribe it accurately with appropriate punctuation."
            }
        };
        let part_prompt = multipart::Part::text(prompt);

        let form = if is_translate {
            multipart::Form::new()
                .part("file", part_file)
                .part("model", part_model)
                .part("prompt", part_prompt)
        } else {
            multipart::Form::new()
                .part("file", part_file)
                .part("model", part_model)
                .part("language", part_language)
                .part("prompt", part_prompt)
        };

        let response = client
            .post(url)
            .headers(headers)
            .multipart(form)
            .send()
            .await?;

        // println!("Status: {}", response.status());
        let json_response: Value = response.json().await?;
        // println!("Response: {:?}", json_response);
        let response_text = json_response["text"]
            .as_str()
            .unwrap_or("text field not found");

        Ok(response_text.to_string())
    }

    fn convert(&mut self) -> Result<(), rusqlite::Error> {
        let vosk_speech = self.sqlite.select_vosk(self.note_id);
        return vosk_speech.and_then(|speech| {
            let reader = hound::WavReader::open(speech.wav.clone()).unwrap();

            let spec = reader.spec();
            let sample_rate = spec.sample_rate;
            let is_too_short = (reader.duration() / sample_rate as u32) < 1;

            if is_too_short {
                println!("input is too short, so skipping...");
                let mut updated = self
                    .sqlite
                    .update_model_vosk_to_whisper(speech.id, "".to_string())
                    .unwrap();
                updated.content = speech.content;
                self.app_handle
                    .clone()
                    .emit("finalTextConverted", updated)
                    .unwrap();
                return Ok(());
            }

            let result = Self::request(
                self.speaker_language.clone(),
                speech.wav,
                self.token.clone(),
                self.transcription_accuracy.ends_with("en"),
            );

            if result.is_ok() {
                let updated = self
                    .sqlite
                    .update_model_vosk_to_whisper(speech.id, result.unwrap());

                self.app_handle
                    .clone()
                    .emit("finalTextConverted", updated.unwrap())
                    .unwrap();
            } else {
                println!("whisper api is temporally failed, so skipping...")
            }

            Ok(())
        });
    }
}

pub static SINGLETON_INSTANCE: Mutex<Option<TranscriptionOnline>> = Mutex::new(None);

pub fn initialize_transcription_online(
    app_handle: AppHandle,
    transcription_accuracy: String,
    speaker_language: String,
    note_id: u64,
) {
    let mut singleton = SINGLETON_INSTANCE.lock().unwrap();
    if singleton.is_none() {
        *singleton = Some(TranscriptionOnline::new(
            app_handle,
            transcription_accuracy,
            speaker_language,
            note_id,
        ));
    }
}

pub fn drop_transcription_online() {
    let mut singleton = SINGLETON_INSTANCE.lock().unwrap();
    *singleton = None;
}
