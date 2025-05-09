#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use serde_json::Value;
use tauri::{
    http::response::Builder as ResponseBuilder,
    path::BaseDirectory,
    AppHandle, Emitter, Manager, State
};
use http_range::HttpRange;
use tauri_plugin_sql::{Migration, MigrationKind};
use tokio::runtime::Runtime;

use std::{
    cmp::min,
    collections::HashMap,
    env,
    io::{Read, Seek, SeekFrom},
    path::PathBuf,
    str::FromStr,
    sync::{Arc, Mutex},
};

use crossbeam_channel::{unbounded, Sender};
use urlencoding::decode;

mod module;
use module::{
    action::{self, request_gpt_tool},
    agents,
    chat_online::ChatOnline,
    deleter::NoteDeleter,
    device::{self, Device},
    discord_client::DiscordClient,
    downloader::{
        model_dir::ModelDirDownloader, sbv2::StyleBertVits2ModelDownloader,
        sbv2_voice::StyleBertVits2VoiceModelDownloader, vosk::VoskModelDownloader,
        whisper::WhisperModelDownloader,
    },
    emotion,
    mcp_host::{
        self, add_mcp_config, delete_mcp_config, get_mcp_tools, initialize_mcp_host,
        test_tool_connection, MCPHost, ToolConnectTestRequest,
    },
    model_type_sbv2::ModelTypeStyleBertVits2,
    model_type_vosk::ModelTypeVosk,
    model_type_whisper::ModelTypeWhisper,
    online_llm_client::{ApprovedResult, OnlineLLMClient},
    permissions,
    record::Record,
    record_desktop::RecordDesktop,
    screenshot::{self, AppWindow},
    slack_client::SlackClient,
    sqlite::{Agent, Sqlite, ToolExecution},
    synthesizer::{self, Synthesizer},
    transcription::{TraceCompletion, Transcription},
    transcription_amivoice::TranscriptionAmivoice,
    transcription_hybrid::TranscriptionHybrid,
    transcription_ja::TranscriptionJa,
    transcription_online::TranscriptionOnline,
    translation_en::TranslationEn,
    translation_ja::TranslationJa,
    translation_ja_high::TranslationJaHigh,
};

struct RecordState(Arc<Mutex<Option<Sender<()>>>>);
struct SynthesizeState(Arc<Mutex<Option<Synthesizer>>>);

struct MCPHostState(Arc<Mutex<Option<MCPHost>>>);
struct RuntimeState(Arc<Runtime>);
struct ToolsState(HashMap<String, Vec<Value>>);

const BUNDLE_IDENTIFIER: &str = "blog.aota.Lycoris";

#[tauri::command]
fn list_synthesize_models_command(app_handle: AppHandle) -> Vec<String> {
    synthesizer::list_models(app_handle)
}

#[tauri::command]
async fn synthesize_init_command(
    state: State<'_, SynthesizeState>,
    app_handle: AppHandle,
    model: String,
) -> Result<bool, ()> {
    let state_clone = state.0.clone();
    let synthesizer = Synthesizer::new(app_handle, model);
    let mut lock = state_clone.lock().unwrap();
    *lock = Some(synthesizer);
    Ok(true)
}

#[tauri::command]
fn synthesize_finalize_command(state: State<'_, SynthesizeState>) -> bool {
    let mut lock = state.0.lock().unwrap();
    lock.take();
    true
}

#[tauri::command]
async fn synthesize_command(
    state: State<'_, SynthesizeState>,
    text: String,
    sdp_ratio: f32,
    length_scale: f32,
) -> Result<Vec<u8>, String> {
    let mut lock = state.0.lock().unwrap();
    let synthesizer = lock.as_mut().unwrap();
    synthesizer.synthesize(text, sdp_ratio, length_scale)
}

#[tauri::command]
fn delete_note_command(app_handle: AppHandle, note_id: u64) {
    std::thread::spawn(move || {
        let deleter = NoteDeleter::new(app_handle);
        deleter.delete(note_id)
    });
}

#[tauri::command]
fn download_whisper_model_command(app_handle: AppHandle, model: String) {
    std::thread::spawn(move || {
        let dl = WhisperModelDownloader::new(app_handle);
        dl.download(ModelTypeWhisper::from_str(&model).unwrap())
    });
}

#[tauri::command]
fn download_vosk_model_command(app_handle: AppHandle, model: String) {
    std::thread::spawn(move || {
        let dl = VoskModelDownloader::new(app_handle);
        dl.download(ModelTypeVosk::from_str(&model).unwrap())
    });
}

#[tauri::command]
fn download_fugumt_enja_model_command(app_handle: AppHandle) {
    std::thread::spawn(move || {
        let dl = ModelDirDownloader::new(app_handle);
        dl.download("fugumt-en-ja", "downloadFugumtEnJaProgress")
    });
}

#[tauri::command]
fn download_fugumt_jaen_model_command(app_handle: AppHandle) {
    std::thread::spawn(move || {
        let dl = ModelDirDownloader::new(app_handle);
        dl.download("fugumt-ja-en", "downloadFugumtJaEnProgress")
    });
}

#[tauri::command]
fn download_honyaku13b_model_command(app_handle: AppHandle) {
    std::thread::spawn(move || {
        let dl = ModelDirDownloader::new(app_handle);
        dl.download("honyaku-13b", "downloadHonyaku13BProgress")
    });
}

#[tauri::command]
fn download_reazonspeech_model_command(app_handle: AppHandle) {
    std::thread::spawn(move || {
        let dl = ModelDirDownloader::new(app_handle);
        dl.download("reazonspeech", "downloadReazonSpeechProgress")
    });
}

#[tauri::command]
fn download_sbv2_command(app_handle: AppHandle) {
    std::thread::spawn(move || {
        let dl = StyleBertVits2ModelDownloader::new(app_handle);
        dl.download()
    });
}

#[tauri::command]
fn download_sbv2_model_command(app_handle: AppHandle, model: String) {
    std::thread::spawn(move || {
        let dl = StyleBertVits2VoiceModelDownloader::new(app_handle);
        dl.download(ModelTypeStyleBertVits2::from_str(&model).unwrap())
    });
}

#[tauri::command]
fn download_kushinada_model_command(app_handle: AppHandle) {
    std::thread::spawn(move || {
        let dl = ModelDirDownloader::new(app_handle);
        dl.download(
            "kushinada-hubert-large-jtes-er",
            "downloadKushinadaProgress",
        )
    });
}

#[tauri::command]
fn list_devices_command() -> Vec<Device> {
    device::list_devices()
}

#[tauri::command]
fn list_apps_command() -> Vec<String> {
    screenshot::list_apps()
}

#[tauri::command]
fn list_app_windows_command(app_name: String) -> Vec<AppWindow> {
    screenshot::list_app_windows(app_name)
}

#[tauri::command]
async fn screenshot_command(
    app_handle: AppHandle,
    window_id: u32,
    note_id: u64,
) -> Result<bool, ()> {
    let result = screenshot::screenshot(window_id, note_id, app_handle);
    Ok(result)
}

#[tauri::command]
fn has_accessibility_permission_command() -> bool {
    permissions::has_accessibility_permission()
}

#[tauri::command]
fn has_screen_capture_permission_command(app_handle: AppHandle) -> bool {
    permissions::has_screen_capture_permission(app_handle)
}

#[tauri::command]
fn has_microphone_permission_command(app_handle: AppHandle) -> bool {
    permissions::has_microphone_permission(app_handle)
}

#[tauri::command]
async fn execute_action_command(
    tools_state: State<'_, ToolsState>,
    app_handle: AppHandle,
    note_id: u64,
) -> Result<(), String> {
    let tools = tools_state.0.clone();

    tokio::task::spawn_blocking(move || {
        if action::initialize_action(app_handle, note_id) {
            let mut lock = action::SINGLETON_INSTANCE.lock().unwrap();
            if let Some(singleton) = lock.as_mut() {
                singleton.execute(tools);
            }
        } else {
            println!("Action is already initialized and executing. Skipping.");
        }
        action::drop_action();
    });

    Ok(())
}

#[tauri::command]
fn start_command(
    state: State<'_, RecordState>,
    app_handle: AppHandle,
    device_label: String,
    speaker_language: String,
    transcription_accuracy: String,
    note_id: u64,
    device_type: String, // microphone, desktop, both
    has_emotion: bool,
) {
    let mut lock = state.0.lock().unwrap();
    let (stop_record_tx, stop_record_rx) = unbounded();
    *lock = Some(stop_record_tx);

    let app_handle_clone = app_handle.clone();
    if has_emotion {
        std::thread::spawn(move || {
            emotion::initialize_emotion(app_handle_clone, note_id);
        });
    }

    std::thread::spawn(move || {
        if device_type == "microphone" {
            let record = Record::new(app_handle);
            record.start(
                device_label,
                speaker_language,
                transcription_accuracy,
                note_id,
                stop_record_rx,
            );
        } else if device_type == "desktop" {
            let record_desktop = RecordDesktop::new(app_handle);
            record_desktop.start(
                speaker_language,
                transcription_accuracy,
                note_id,
                stop_record_rx,
                None,
            );
        } else {
            let record = Record::new(app_handle.clone());
            let record_desktop = RecordDesktop::new(app_handle);

            let (stop_record_clone_tx, stop_record_clone_rx) = unbounded();
            let speaker_language_clone = speaker_language.clone();
            let transcription_accuracy_clone = transcription_accuracy.clone();

            std::thread::spawn(move || {
                record_desktop.start(
                    speaker_language_clone,
                    transcription_accuracy_clone,
                    note_id,
                    stop_record_rx,
                    Some(stop_record_clone_tx),
                );
            });
            record.start(
                device_label,
                speaker_language,
                transcription_accuracy,
                note_id,
                stop_record_clone_rx.clone(),
            );
        }
    });
}

#[tauri::command]
fn stop_command(state: State<'_, RecordState>) {
    let mut lock = state.0.lock().unwrap();
    if let Some(stop_record_tx) = lock.take() {
        stop_record_tx.send(()).unwrap()
    }
    std::thread::spawn(move || {
        emotion::drop_emotion();
    });
}

#[tauri::command]
fn start_trace_command(
    state: State<'_, RecordState>,
    app_handle: AppHandle,
    speaker_language: String,
    transcription_accuracy: String,
    note_id: u64,
    has_emotion: bool,
) {
    let mut lock = state.0.lock().unwrap();
    let (stop_convert_tx, stop_convert_rx) = unbounded();
    *lock = Some(stop_convert_tx);

    let app_handle_clone = app_handle.clone();
    if has_emotion {
        std::thread::spawn(move || {
            emotion::initialize_emotion(app_handle_clone, note_id);
        });
    }

    std::thread::spawn(move || {
        if transcription_accuracy.starts_with("online-transcript") {
            let mut transcription_online = TranscriptionOnline::new(
                app_handle,
                transcription_accuracy,
                speaker_language,
                note_id,
            );
            transcription_online.start(stop_convert_rx, true);
        } else if transcription_accuracy.starts_with("online-amivoice") {
            let mut transcription_amivoice = TranscriptionAmivoice::new(app_handle, note_id);
            transcription_amivoice.start(stop_convert_rx, true);
        } else if transcription_accuracy.starts_with("online-chat") {
            let mut chat_online = ChatOnline::new(app_handle, speaker_language, note_id);
            chat_online.start(stop_convert_rx, true);
        } else if transcription_accuracy.starts_with("fugumt-en-ja") {
            let mut translation_ja = TranslationJa::new(app_handle, speaker_language, note_id);
            translation_ja.start(stop_convert_rx, true);
        } else if transcription_accuracy.starts_with("fugumt-ja-en") {
            let mut translation_en = TranslationEn::new(app_handle, note_id);
            translation_en.start(stop_convert_rx, true);
        } else if transcription_accuracy.starts_with("honyaku-13b") {
            let mut translation_ja_high =
                TranslationJaHigh::new(app_handle, speaker_language, note_id);
            translation_ja_high.start(stop_convert_rx, true);
        } else if transcription_accuracy.starts_with("reazonspeech") {
            let mut transcription_ja = TranscriptionJa::new(app_handle, note_id);
            transcription_ja.start(stop_convert_rx, true);
        } else if transcription_accuracy.starts_with("hybrid-transcript") {
            let mut transcription_hybrid = TranscriptionHybrid::new(app_handle, note_id);
            transcription_hybrid.start(stop_convert_rx, true);
        } else {
            let mut transcription = Transcription::new(
                app_handle,
                transcription_accuracy,
                speaker_language,
                note_id,
            );
            transcription.start(stop_convert_rx, true);
        }
    });
}

#[tauri::command]
fn stop_trace_command(state: State<'_, RecordState>, app_handle: AppHandle) {
    let mut lock = state.0.lock().unwrap();
    if let Some(stop_convert_tx) = lock.take() {
        stop_convert_tx.send(()).unwrap_or_else(|_| {
            app_handle
                .emit("traceCompletion", TraceCompletion {})
                .unwrap();
        })
    }
    std::thread::spawn(move || {
        emotion::drop_emotion();
    });
}

#[tauri::command]
async fn test_mcp_tool_command(
    tool_connect_test_request: ToolConnectTestRequest,
) -> Result<bool, String> {
    tokio::task::spawn_blocking(move || {
        let runtime = tokio::runtime::Runtime::new()
            .map_err(|e| format!("Failed to create runtime: {}", e))?;

        runtime.block_on(async {
            match test_tool_connection(&tool_connect_test_request).await {
                Ok(result) => Ok(result),
                Err(e) => {
                    eprintln!("Tool connection test failed: {}", e);
                    Err(e.to_string())
                }
            }
        })
    })
    .await
    .map_err(|e| format!("Task execution failed: {}", e))?
}

#[tauri::command]
async fn add_mcp_config_command(
    config: mcp_host::Config,
    app_handle: AppHandle,
) -> Result<Vec<Value>, String> {
    let tools = add_mcp_config(config, app_handle).await?;
    let serialized_tools = tools
        .into_iter()
        .map(|tool| {
            let tool_value = serde_json::json!({
                "name": tool.name,
                "disabled": tool.disabled,
                "instruction": tool.instruction,
                "ai_auto_approve": tool.ai_auto_approve,
                "auto_approve": tool.auto_approve,
            });
            tool_value
        })
        .collect::<Vec<Value>>();
    Ok(serialized_tools)
}

#[tauri::command]
fn delete_mcp_config_command(tool_names: Vec<String>, app_handle: AppHandle) -> Result<(), String> {
    delete_mcp_config(tool_names, app_handle)
}

#[tauri::command]
fn get_mcp_tools_command(app_handle: AppHandle) -> Result<Vec<Value>, String> {
    let tools = get_mcp_tools(app_handle)?;
    let serialized_tools = tools
        .into_iter()
        .map(|tool| {
            let tool_value = serde_json::json!({
                "name": tool.name,
                "disabled": tool.disabled,
                "instruction": tool.instruction,
                "ai_auto_approve": tool.ai_auto_approve,
                "auto_approve": tool.auto_approve,
            });
            Ok(tool_value)
        })
        .collect::<Result<Vec<Value>, String>>()?;
    Ok(serialized_tools)
}

#[tauri::command]
fn update_content_2_on_speech_command(
    speech_id: u64,
    content_2: String,
    app_handle: AppHandle,
) -> Result<(), String> {
    let sqlite = Sqlite::new(app_handle);
    sqlite
        .update_content_2_on_speech(speech_id, content_2)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn update_tool_command(
    tool_name: String,
    disabled: u16,
    ai_auto_approve: u16,
    instruction: String,
    auto_approve: Vec<String>,
    app_handle: AppHandle,
) -> Result<(), String> {
    let sqlite = Sqlite::new(app_handle);
    sqlite
        .update_tool(
            tool_name,
            disabled,
            ai_auto_approve,
            instruction,
            auto_approve,
        )
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_mcp_tool_features_command(
    runtime_state: State<'_, RuntimeState>,
    state: State<'_, MCPHostState>,
    tool_name: String,
) -> Result<Vec<Value>, String> {
    let runtime = runtime_state.0.clone();
    let state_clone = state.0.clone();

    tokio::task::spawn_blocking(move || {
        runtime.block_on(async move {
            let host = {
                let lock = state_clone.lock().unwrap();
                match &*lock {
                    Some(host) => host.clone(),
                    None => return Err("MCPHost not initialized".to_string()),
                }
            };

            host.get_tool_features(&tool_name)
                .await
                .map_err(|e| e.to_string())
        })
    })
    .await
    .map_err(|e| format!("Runtime error: {}", e))?
}

#[tauri::command]
async fn execute_mcp_tool_feature_command(
    runtime_state: State<'_, RuntimeState>,
    state: State<'_, MCPHostState>,
    tools_state: State<'_, ToolsState>,
    speech_id: u64,
    app_handle: AppHandle,
) -> Result<ToolExecution, String> {
    let runtime = runtime_state.0.clone();
    let state_clone = state.0.clone();
    let tools_clone = tools_state.0.clone();
    let online_llm_client = OnlineLLMClient::new(app_handle.clone());
    tokio::task::spawn_blocking(move || {
        runtime.block_on(async move {
            let host = {
                let lock = state_clone.lock().unwrap();
                match &*lock {
                    Some(host) => host.clone(),
                    None => return Err("MCPHost not initialized".to_string()),
                }
            };
            let sqlite = Sqlite::new(app_handle);
            let tool_execution_wrapper = sqlite.select_tool(speech_id).unwrap();
            let tool_execution = tool_execution_wrapper.tool_execution;
            let mut updated_cmds = Vec::new();
            for mut cmd in tool_execution.cmds {
                if cmd.result.is_some() && !cmd.result.clone().unwrap().is_empty() {
                    updated_cmds.push(cmd);
                    continue;
                }
                let tool_args = cmd.args.clone();

                if cmd.name == "system" && cmd.method == "search_web_with_openai" {
                    let question = tool_args["question"].as_str().unwrap().to_string();
                    let result = online_llm_client.search_web_with_openai(question).await;
                    cmd.result = match result {
                        Ok(value) => Some(value),
                        Err(e) => Some(format!("Error: {}", e)),
                    };
                } else {
                    let host = host.clone();
                    let result = host
                        .execute_tool_feature(&cmd.name, &cmd.method, tool_args)
                        .await
                        .map_err(|e| e.to_string());
                    cmd.result = match result {
                        Ok(value) => {
                            if let Some(content) = value.get("content") {
                                Some(content.to_string())
                            } else {
                                Some(value.to_string())
                            }
                        }
                        Err(err) => Some(format!("Error: {}", err)),
                    };
                }

                updated_cmds.push(cmd);
            }

            let id = tool_execution_wrapper.id;
            let note_id = tool_execution_wrapper.note_id;
            let question = tool_execution_wrapper.content;
            let contents = sqlite.select_contents_by(note_id, id).unwrap();
            let token = sqlite.select_whisper_token().unwrap();
            let updated_tools = sqlite.select_all_tools().unwrap();
            let survey_tool_enabled = sqlite.select_survey_tool_enabled().unwrap();
            let search_tool_enabled = sqlite.select_search_tool_enabled().unwrap();
            let result = request_gpt_tool(
                tools_clone,
                question,
                contents,
                token,
                Some(updated_cmds),
                updated_tools,
                survey_tool_enabled,
                search_tool_enabled,
            )
            .await
            .unwrap();

            sqlite
                .update_tool_execution(speech_id, &result)
                .map_err(|e| format!("Failed to update database: {}", e))?;

            Ok(result)
        })
    })
    .await
    .map_err(|e| format!("Runtime error: {}", e))?
}

#[tauri::command]
async fn check_approve_cmds_command(
    note_id: u64,
    speech_id: u16,
    cmds: Vec<Value>,
    app_handle: AppHandle,
) -> Result<ApprovedResult, String> {
    let target = cmds
        .into_iter()
        .map(|cmd| {
            let tool_name = cmd["name"].as_str().unwrap();
            let method = cmd["method"].as_str().unwrap();
            let args = cmd["args"].as_str().unwrap();
            let description = cmd["description"].as_str().unwrap();
            let instruction = cmd["instruction"].as_str().unwrap();
            (
                tool_name.to_string(),
                method.to_string(),
                args.to_string(),
                description.to_string(),
                instruction.to_string(),
            )
        })
        .collect::<Vec<(String, String, String, String, String)>>();

    let online_llm_client = OnlineLLMClient::new(app_handle.clone());
    let result = online_llm_client
        .check_approve_cmds(note_id, speech_id, target, app_handle)
        .await?;

    Ok(result)
}

#[tauri::command]
async fn send_slack_message_command(
    content: String,
    app_handle: AppHandle,
) -> Result<String, String> {
    let slack_client: SlackClient = SlackClient::new(app_handle.clone());
    let result = slack_client.send_message(content).await;

    result
}

#[tauri::command]
async fn send_discord_message_command(
    content: String,
    app_handle: AppHandle,
) -> Result<String, String> {
    let discord_client: DiscordClient = DiscordClient::new(app_handle.clone());
    let result = discord_client.send_message(content).await;

    result
}

#[derive(Default)]
pub struct AgentsExecutionState {
    pub is_executing_map: Arc<Mutex<HashMap<String, bool>>>,
}

#[tauri::command]
fn execute_agent_command(
    note_id: u64,
    agents: Vec<String>,
    app_handle: AppHandle,
    state: State<AgentsExecutionState>,
) -> Result<(), String> {
    let is_executing_map = state.is_executing_map.clone();

    for agent in agents {
        let agent_for_thread = agent.clone();
        let app_handle_clone = app_handle.clone();
        let is_executing_map_clone = is_executing_map.clone();

        {
            let mut map = is_executing_map_clone
                .lock()
                .map_err(|e| format!("Failed to lock is_executing_map: {}", e))?;

            if let Some(true) = map.get(&agent) {
                println!("Agent `{}` is already running. Skipping.", agent);
                continue;
            }

            map.insert(agent.clone(), true);
        }

        std::thread::spawn(move || {
            let mut agent = agents::Agent::new(app_handle_clone, note_id, agent_for_thread.clone());
            agent.start();

            {
                let mut map = is_executing_map_clone.lock().unwrap();
                map.insert(agent_for_thread.clone(), false);
            }
        });
    }

    Ok(())
}

#[derive(Default)]
pub struct EmotionState {
    pub is_executing: Arc<Mutex<bool>>,
}

#[tauri::command]
fn execute_emotion_command(state: State<EmotionState>) -> Result<(), String> {
    let is_executing = state.is_executing.clone();

    {
        let mut executing_flag = is_executing.lock().map_err(|_| "Mutex lock error")?;
        if *executing_flag {
            println!("Emotion command is already running. Skipped.");
            return Ok(());
        }
        *executing_flag = true;
    }

    std::thread::spawn(move || {
        emotion::start_emotion();

        if let Ok(mut executing_flag) = is_executing.lock() {
            *executing_flag = false;
        }
    });

    Ok(())
}

#[tauri::command]
fn insert_agent_command(
    name: String,
    has_workspace: u16,
    mode: u16,
    role_prompt: String,
    tool_list: String,
    ref_recent_conversation: u16,
    app_handle: AppHandle,
) -> Result<Agent, String> {
    let sqlite = Sqlite::new(app_handle);
    sqlite
        .insert_agent(
            name,
            has_workspace,
            mode,
            role_prompt,
            tool_list,
            ref_recent_conversation,
        )
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn select_all_agents_command(app_handle: AppHandle) -> Result<Vec<Agent>, String> {
    let sqlite = Sqlite::new(app_handle);
    sqlite.select_all_agents().map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_agents_command(agent_names: Vec<String>, app_handle: AppHandle) -> Result<(), String> {
    let sqlite = Sqlite::new(app_handle);
    sqlite.delete_agents(agent_names).map_err(|e| e.to_string())
}

fn main() {
    let _ = fix_path_env::fix();

    tauri::Builder::default()
        .register_uri_scheme_protocol("stream", move |_app, request| {
            let raw_path = request.uri().to_string().replace("stream://localhost", "");
            let decoded_path = decode(raw_path.as_str()).unwrap().to_string();

            let audio_file = PathBuf::from(&decoded_path);
            let mut content = std::fs::File::open(&audio_file).unwrap();
            let mut buf = Vec::new();

            let mut response = ResponseBuilder::new();
            let mut status_code = 200;

            if let Some(range) = request.headers().get("range") {
                let file_size = content.metadata().unwrap().len();
                let range = HttpRange::parse(range.to_str().unwrap(), file_size).unwrap();

                let first_range = range.first();
                if let Some(range) = first_range {
                    let mut real_length = range.length;
                    if range.length > file_size / 3 {
                        real_length = min(file_size - range.start, 1024 * 400);
                    }
                    let last_byte = range.start + real_length - 1;

                    status_code = 206;
                    response = response
                        .header("Connection", "Keep-Alive")
                        .header("Accept-Ranges", "bytes")
                        .header("Content-Length", real_length)
                        .header(
                            "Content-Range",
                            format!("bytes {}-{}/{}", range.start, last_byte, file_size),
                        );

                    content.seek(SeekFrom::Start(range.start)).unwrap();
                    content.take(real_length).read_to_end(&mut buf).unwrap();
                } else {
                    content.read_to_end(&mut buf).unwrap();
                }
            }
            response.header("Content-Type", "audio/wav").status(status_code).body(buf).unwrap()
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    "sqlite:speeches.db",
                    vec![Migration {
                        version: 1,
                        description: "create speeches table",
                        sql: include_str!("../migrations/001.sql"),
                        kind: MigrationKind::Up,
                    }],
                )
                .build(),
        )
        .setup(|app| {
            let dynamic_library_name = "libonnxruntime.1.19.2.dylib";
            let dynamic_library_path = app
                .path()
                .resolve(
                    format!("lib/{}", dynamic_library_name),
                    BaseDirectory::Resource,
                )
                .expect("fail to resolve dynamic library path");
            println!("dynamic lib: {}", dynamic_library_path.display());
            std::env::set_var("ORT_DYLIB_PATH", dynamic_library_path);

            let runtime = Arc::new(Runtime::new().expect("Failed to create Tokio runtime"));
            app.manage(RuntimeState(runtime.clone()));
            app.manage(MCPHostState(Arc::new(Mutex::new(None))));
            let app_handle = app.handle();
            runtime.block_on(async {
                let sqlite = Sqlite::new(app_handle.clone());
                if let Err(e) = sqlite.ensure_tools_table_exists() {
                    eprintln!("Failed to ensure tools table exists: {:?}", e);
                    return;
                }

                match initialize_mcp_host(app_handle.clone()).await {
                    Ok(host) => {
                        let tools = host.get_all_tool_features().await.unwrap();
                        app_handle.manage(ToolsState(tools));
                        if let Some(state) = app_handle.try_state::<MCPHostState>() {
                            let mut lock = state.0.lock().unwrap();
                            *lock = Some(host);
                            println!("MCPHost initialized successfully");
                        }
                    }
                    Err(e) => eprintln!("Failed to initialize MCPHost: {:?}", e),
                }
            });

            Ok(())
        })
        .manage(RecordState(Default::default()))
        .manage(SynthesizeState(Default::default()))
        .manage(AgentsExecutionState::default())
        .manage(EmotionState::default())
        .invoke_handler(tauri::generate_handler![
            list_synthesize_models_command,
            synthesize_init_command,
            synthesize_finalize_command,
            synthesize_command,
            delete_note_command,
            download_whisper_model_command,
            download_vosk_model_command,
            download_fugumt_enja_model_command,
            download_fugumt_jaen_model_command,
            download_honyaku13b_model_command,
            download_reazonspeech_model_command,
            download_sbv2_command,
            download_sbv2_model_command,
            download_kushinada_model_command,
            list_devices_command,
            list_apps_command,
            list_app_windows_command,
            screenshot_command,
            has_accessibility_permission_command,
            has_screen_capture_permission_command,
            has_microphone_permission_command,
            execute_action_command,
            start_command,
            stop_command,
            start_trace_command,
            stop_trace_command,
            test_mcp_tool_command,
            add_mcp_config_command,
            get_mcp_tools_command,
            get_mcp_tool_features_command,
            delete_mcp_config_command,
            execute_mcp_tool_feature_command,
            update_tool_command,
            check_approve_cmds_command,
            update_content_2_on_speech_command,
            send_slack_message_command,
            send_discord_message_command,
            insert_agent_command,
            select_all_agents_command,
            delete_agents_command,
            execute_agent_command,
            execute_emotion_command,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
