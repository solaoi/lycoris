import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core'
import { useRecoilState } from 'recoil';
import { hasPermissionState } from '../store/atoms/hasPermissionState';

const useHasPermissionScreenCapture = (forceReload: boolean | null = null) => {
  const [hasPermission, setPermission] = useRecoilState(hasPermissionState);
  useEffect(() => {
    if (forceReload !== null && !hasPermission) {
      invoke('has_screen_capture_permission_command').then(trusted => setPermission(trusted as boolean))
    }
  }, [forceReload]);

  return hasPermission;
};

export { useHasPermissionScreenCapture };