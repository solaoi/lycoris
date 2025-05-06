import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core'

// Lycoris not yet use this hook
const useHasPermissionAccessibility = (forceReload: boolean | null = null) => {
  const [hasPermission, setPermission] = useState(false);
  useEffect(() => {
    if (forceReload !== null && !hasPermission) {
      invoke('has_accessibility_permission_command').then(trusted => setPermission(trusted as boolean))
    }
  }, [forceReload]);

  return hasPermission;
};

export { useHasPermissionAccessibility };