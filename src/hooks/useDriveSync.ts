import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getDriveClientId,
  isDriveSignedIn,
  signInDrive,
  syncWithDrive,
} from "@/lib/drive-storage";

/** Background sync with Google Drive (appDataFolder). */
export function useDriveSync(onSynced?: () => void) {
  const [syncing, setSyncing] = useState(false);
  const [enabled, setEnabled] = useState(
    () => !!getDriveClientId() && isDriveSignedIn(),
  );
  const onSyncedRef = useRef(onSynced);
  onSyncedRef.current = onSynced;

  const sync = useCallback(async (opts: { silent?: boolean } = {}) => {
    if (!getDriveClientId() || !isDriveSignedIn()) return;
    setSyncing(true);
    try {
      const result = await syncWithDrive();
      if (!opts.silent) {
        toast.success(
          `Synced with Drive (${result.totalCount} composition${
            result.totalCount !== 1 ? "s" : ""
          })`,
        );
      }
      onSyncedRef.current?.();
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error(`Drive sync failed: ${msg}`);
    } finally {
      setSyncing(false);
    }
  }, []);

  const signIn = useCallback(async () => {
    try {
      await signInDrive();
      setEnabled(true);
      toast.success("Connected to Google Drive");
      await sync({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign-in failed");
    }
  }, [sync]);

  // Initial silent sync on mount if already signed in.
  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    if (getDriveClientId() && isDriveSignedIn()) sync({ silent: true });
  }, []);

  const refreshEnabled = useCallback(() => {
    setEnabled(!!getDriveClientId() && isDriveSignedIn());
  }, []);

  return { sync, signIn, syncing, enabled, refreshEnabled };
}
