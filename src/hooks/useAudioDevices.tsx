import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri'

type Device = {
  label: string;
}

const useAudioDevices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  useEffect(() => {
    invoke('list_devices_command').then(devices => setDevices(devices as Device[]))
  }, []);

  return devices;
};

export { useAudioDevices };