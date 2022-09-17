use std::{collections::BTreeMap, time::Duration};

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Device {
    pub device_id: u32,
    pub label: String,
    pub latency: Duration,
}

pub fn list_devices() -> Result<Vec<Device>, portaudio_rs::PaError> {
    portaudio_rs::initialize()?;
    let n = portaudio_rs::device::get_count()?;
    let inputs = (0..n)
        .into_iter()
        .filter_map(|index| {
            let info = portaudio_rs::device::get_info(index)?;
            if info.max_input_channels > 0 {
                Some((index, info))
            } else {
                None
            }
        })
        .collect::<BTreeMap<_, _>>();
    if inputs.is_empty() {
        println!("No input devices found.");
    } else {
        println!("Input devices:");
        for (index, info) in inputs.iter() {
            println!("Index={} Name={}", index, info.name);
        }
    }

    let mut ret: Vec<Device> = Vec::new();
    for (k, v) in &inputs {
        ret.push(Device {
            device_id: *k,
            label: v.name.to_string(),
            latency: v.default_low_input_latency
        })
    }
    Ok(ret)
}
