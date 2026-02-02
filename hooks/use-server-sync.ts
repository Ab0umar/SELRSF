import { useState, useEffect, useCallback } from "react";
import { serverSync } from "@/lib/server-sync";

export interface SyncStatus {
  enabled: boolean;
  lastSyncTime: number;
  isSyncing: boolean;
  nextSyncTime: number;
}

/**
 * Hook to monitor and control server sync status
 */
export function useServerSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    enabled: true,
    lastSyncTime: 0,
    isSyncing: false,
    nextSyncTime: 0,
  });

  // Update sync status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const status = serverSync.getSyncStatus();
      setSyncStatus(status);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleSync = useCallback((enabled: boolean) => {
    serverSync.setSyncEnabled(enabled);
    const status = serverSync.getSyncStatus();
    setSyncStatus(status);
  }, []);

  const syncNow = useCallback(async () => {
    await serverSync.syncAll();
    const status = serverSync.getSyncStatus();
    setSyncStatus(status);
  }, []);

  return {
    ...syncStatus,
    toggleSync,
    syncNow,
  };
}
