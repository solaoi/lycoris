import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri'

const useHasPermissionScreenCapture = (forceReload: boolean | null = null) => {
  const [hasPermission, setPermission] = useState(false);
  useEffect(() => {
    if (forceReload !== null && !hasPermission) {
      invoke('has_screen_capture_permission_command').then(trusted => setPermission(trusted as boolean))
    }
  }, [forceReload]);

  return hasPermission;
};

export { useHasPermissionScreenCapture };