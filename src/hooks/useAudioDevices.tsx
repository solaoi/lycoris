import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core'

type Device = {
  label: string;
}

const useAudioDevices = (forceReload: boolean = false) => {
  const [devices, setDevices] = useState<Device[]>([]);
  useEffect(() => {
    invoke('list_devices_command').then(devices => setDevices(devices as Device[]))
  }, [forceReload]);

  return devices;
};

export { useAudioDevices };