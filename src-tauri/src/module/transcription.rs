use super::{sqlite::Sqlite, transcriber::Transcriber};

use crossbeam_channel::Receiver;

use hound::SampleFormat;
use samplerate_rs::{convert, ConverterType};
use tauri::{AppHandle, Manager};

pub struct Transcription {
    app_handle: AppHandle,
    sqlite: Sqlite,
}

impl Transcription {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            app_handle,
            sqlite: Sqlite::new(),
        }
    }

    pub fn start(&self, stop_convert_rx: Receiver<()>) {
        while Self::convert(self).is_ok() {
            if stop_convert_rx.try_recv().is_ok() {
                break;
            }
        }
    }

    fn convert(&self) -> Result<(), rusqlite::Error> {
        let vosk_speech = self.sqlite.select_vosk();

        return vosk_speech.and_then(|speech| {
            let mut reader = hound::WavReader::open(speech.wav).unwrap();

            let spec = reader.spec();
            let mut data =
                Vec::with_capacity((spec.channels as usize) * (reader.duration() as usize));
            match (spec.bits_per_sample, spec.sample_format) {
                (16, SampleFormat::Int) => {
                    for sample in reader.samples::<i16>() {
                        data.push((sample.unwrap() as f32) / (0x7fffi32 as f32));
                    }
                }
                (24, SampleFormat::Int) => {
                    for sample in reader.samples::<i32>() {
                        let val = (sample.unwrap() as f32) / (0x00ff_ffffi32 as f32);
                        data.push(val);
                    }
                }
                (32, SampleFormat::Int) => {
                    for sample in reader.samples::<i32>() {
                        data.push((sample.unwrap() as f32) / (0x7fff_ffffi32 as f32));
                    }
                }
                (32, SampleFormat::Float) => {
                    for sample in reader.samples::<f32>() {
                        data.push(sample.unwrap());
                    }
                }
                _ => panic!(
                    "Tried to read file but there was a problem: {:?}",
                    hound::Error::Unsupported
                ),
            }
            let data = if spec.channels != 1 {
                whisper_rs::convert_stereo_to_mono_audio(&data)
            } else {
                data
            };
            let audio_data = convert(
                spec.sample_rate,
                16000,
                1,
                ConverterType::SincBestQuality,
                &data,
            )
            .unwrap();

            let mut ctx = Transcriber::build(self.app_handle.clone());
            let result = ctx.full(Transcriber::build_params(), &audio_data[..]);
            if result.is_ok() {
                let num_segments = ctx.full_n_segments();
                let mut converted: Vec<String> = vec!["".to_string()];
                for i in 0..num_segments {
                    let segment = ctx.full_get_segment_text(i).expect("failed to get segment");
                    let last = converted.last().unwrap().as_str();
                    if segment != last
                        && segment != "(??????)"
                        && segment != "[??????]"
                        && segment != "(??????)"
                        && segment != "(??????)"
                        && segment != "(EN)"
                        && segment != "(???)"
                    {
                        converted.push(segment);
                    }
                }

                let updated = self
                    .sqlite
                    .update_model_vosk_to_whisper(speech.id, converted.join(""));

                let updated = updated.unwrap();
                if updated.content != "" {
                    self.app_handle
                        .clone()
                        .emit_all("finalTextConverted", updated)
                        .unwrap();
                }
            } else {
                println!("whisper is temporally failed, so skipping...")
            }

            Ok(())
        });
    }
}
