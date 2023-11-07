use std::{
    fs::File,
    io::BufWriter,
    sync::{Arc, Mutex},
};

use hound::{WavSpec, WavWriter};

pub struct Writer {}

type WavWriterHandle = Arc<Mutex<Option<(WavWriter<BufWriter<File>>, String)>>>;

impl Writer {
    pub fn build(path: &str, spec: WavSpec) -> (WavWriter<BufWriter<File>>, String) {
        (WavWriter::create(path, spec).unwrap(), path.to_string())
    }

    pub fn wav_spec_from_config(config: &cpal::SupportedStreamConfig) -> WavSpec {
        WavSpec {
            channels: 1,
            sample_rate: config.sample_rate().0 as _,
            bits_per_sample: (config.sample_format().sample_size() * 8) as _,
            sample_format: Self::sample_format(config.sample_format()),
        }
    }

    pub fn write_input_data<T, U>(input: &[T], writer: &WavWriterHandle)
    where
        T: cpal::Sample,
        U: cpal::Sample + hound::Sample,
    {
        if let Ok(mut guard) = writer.try_lock() {
            if let Some(writer) = guard.as_mut() {
                let mut silence_passed = false;
                for &sample in input.iter() {
                    let sample: U = cpal::Sample::from(&sample);
                    if Self::to_float(&sample).abs() > 0.01 {
                        silence_passed = true;
                    }
                    if silence_passed {
                        writer.0.write_sample(sample).ok();
                    }
                }
            }
        }
    }

    fn to_float<S: cpal::Sample>(sample: &S) -> f32 {
        let sample_f32 = sample.to_f32();
        let sample_i16 = sample.to_i16();
        let sample_u16 = sample.to_u16();
        let max_abs = sample_f32
            .abs()
            .max(sample_i16.abs() as f32)
            .max(sample_u16 as f32);
        if max_abs == sample_f32.abs() {
            sample_f32
        } else if max_abs == sample_i16.abs() as f32 {
            sample_i16 as f32 / i16::MAX as f32
        } else {
            (sample_u16 as f32 - u16::MAX as f32 / 2.0) / (u16::MAX as f32 / 2.0)
        }
    }

    fn sample_format(format: cpal::SampleFormat) -> hound::SampleFormat {
        match format {
            cpal::SampleFormat::U16 => hound::SampleFormat::Int,
            cpal::SampleFormat::I16 => hound::SampleFormat::Int,
            cpal::SampleFormat::F32 => hound::SampleFormat::Float,
        }
    }
}
