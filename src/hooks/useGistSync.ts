import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getGistId, getGistToken, syncWithGist } from "@/lib/gist-storage";

/** Manages background sync with GitHub Gist when a token is configured. */
export function useGistSync(onSynced?: () => void) {
  const [syncing, setSyncing] = useState(false);
  const [enabled, setEnabled] = useState(() => !!getGistToken());
  const onSyncedRef = useRef(onSynced);
  onSyncedRef.current = onSynced;

  const sync = useCallback(async (opts: { silent?: boolean } = {}) => {
    if (!getGistToken()) return;
    setSyncing(true);
    try {
      const result = await syncWithGist();
      if (!opts.silent) {
        toast.success(
          `Synced with Gist (${result.totalCount} composition${
            result.totalCount !== 1 ? "s" : ""
          })`,
        );
      }
      onSyncedRef.current?.();
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error(`Gist sync failed: ${msg}`);
    } finally {
      setSyncing(false);
    }
  }, []);

  // Initial sync on mount if token is configured.
  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    if (getGistToken()) sync({ silent: true });
  }, []);

  const refreshEnabled = useCallback(() => {
    setEnabled(!!getGistToken());
  }, []);

  return {
    sync,
    syncing,
    enabled,
    refreshEnabled,
    hasGist: !!getGistId(),
  };
}
