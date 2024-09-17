use cpal::traits::{DeviceTrait, HostTrait};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Device {
    pub label: String,
}

pub fn list_devices() -> Vec<Device> {
    let host = cpal::default_host();
    return host
        .input_devices()
        .unwrap()
        .filter_map(|device| {
            if device.name().is_ok() && (device.name().unwrap().contains("ZoomAudioDevice") || device.name().unwrap().contains("Microsoft Teams Audio")) {
                None
            } else {
                Some(Device {
                    label: device.name().unwrap(),
                })
            }
        })
        .collect();
}
