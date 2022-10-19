use std::{
    fs::File,
    io::BufWriter,
    sync::{Arc, Mutex},
};

use hound::{WavSpec, WavWriter};

pub struct Writer {}

type WavWriterHandle = Arc<Mutex<Option<hound::WavWriter<BufWriter<File>>>>>;

impl Writer {
    pub fn build(path: &str, spec: WavSpec) -> WavWriter<BufWriter<File>> {
        hound::WavWriter::create(path, spec).unwrap()
    }

    pub fn wav_spec_from_config(config: &cpal::SupportedStreamConfig) -> hound::WavSpec {
        hound::WavSpec {
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
                for &sample in input.iter() {
                    let sample: U = cpal::Sample::from(&sample);
                    writer.write_sample(sample).ok();
                }
            }
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