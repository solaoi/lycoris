import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri'
import { dialog } from '@tauri-apps/api';

const useHasPermissionRecord = (forceReload: boolean | null = null) => {
  const [hasPermission, setPermission] = useState(false);
  const checkPermission = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setPermission(true);
    stream.getTracks().forEach((track) => track.stop());
  }

  useEffect(() => {
    const asyncFunc = async () => {
      try {
        await checkPermission();
      } catch (error) {
        const result = await dialog.confirm('システム設定の"セキュリティとプライバシー"設定で、このアプリケーションへのアクセスを許可してください。', '"Lycoris.app"からマイクにアクセスしようとしています。');
        if (result) {
          invoke('open_microphone_permission_command').then(trusted => setPermission(trusted as boolean))
        }
      }
    };
    if (forceReload !== null && !hasPermission) asyncFunc();
    if (forceReload === null) {
      try {
        setTimeout(checkPermission, 0);
      } catch (error) { }
    }
  }, [forceReload]);

  return hasPermission;
};

export { useHasPermissionRecord };