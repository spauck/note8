import {
  Check,
  CloudDownload,
  CloudOff,
  CloudUpload,
  HardDriveDownload,
  Loader2,
  PencilLine,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SaveStatusIndicatorProps {
  /** Composition has unsaved changes vs. the named save slot. */
  dirty: boolean;
  /** A named save slot has been written for this composition. */
  hasSavedSlot: boolean;
  /** Autosave is behind the current state (write pending). */
  autosavePending: boolean;
  /** Cloud (Gist) sync is configured. */
  syncEnabled: boolean;
  /** Cloud sync is in progress. */
  syncing: boolean;
  /** Local saved record has unsynced changes (newer than last sync). */
  cloudUploadPending: boolean;
  /** Remote has a newer version of the currently loaded composition. */
  remoteNewerAvailable: boolean;
  /** Click handler for the "newer in cloud" badge. */
  onLoadRemote?: () => void;
}

type Tone = "muted" | "warn" | "ok" | "info";

const TONE_CLASS: Record<Tone, string> = {
  muted: "text-muted-foreground",
  warn: "text-amber-500",
  ok: "text-emerald-500",
  info: "text-sky-500",
};

export const SaveStatusIndicator = ({
  dirty,
  hasSavedSlot,
  autosavePending,
  syncEnabled,
  syncing,
  cloudUploadPending,
  remoteNewerAvailable,
  onLoadRemote,
}: SaveStatusIndicatorProps) => {
  // Primary state: dirty vs saved
  let Icon = Check;
  let label = "Saved";
  let tone: Tone = "ok";

  if (dirty) {
    if (autosavePending) {
      Icon = PencilLine;
      label = "Editing — autosave pending";
      tone = "warn";
    } else {
      Icon = HardDriveDownload;
      label = hasSavedSlot
        ? "Unsaved changes — autosaved locally"
        : "Autosaved locally — not saved to library";
      tone = "warn";
    }
  } else if (!hasSavedSlot) {
    Icon = HardDriveDownload;
    label = "Autosaved locally — not saved to library";
    tone = "info";
  } else {
    Icon = Check;
    label = "Saved to library";
    tone = "ok";
  }

  let cloudIcon = CloudUpload;
  let cloudTone: Tone = "ok";
  let cloudLabel = "Synced with cloud";
  if (syncing) {
    cloudIcon = Loader2;
    cloudTone = "info";
    cloudLabel = "Syncing with cloud…";
  } else if (cloudUploadPending) {
    cloudIcon = CloudUpload;
    cloudTone = "warn";
    cloudLabel = "Local changes not yet uploaded";
  }

  return (
    <TooltipProvider delayDuration={150}>
      <span className="inline-flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={`inline-flex items-center ${TONE_CLASS[tone]}`}
              aria-label={label}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">{label}</TooltipContent>
        </Tooltip>

        {syncEnabled ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={`inline-flex items-center ${TONE_CLASS[cloudTone]}`}
                aria-label={cloudLabel}
              >
                {cloudIcon === Loader2 ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CloudUpload className="h-3.5 w-3.5" />
                )}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">{cloudLabel}</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={`inline-flex items-center ${TONE_CLASS.muted}`}
                aria-label="Cloud sync not configured"
              >
                <CloudOff className="h-3.5 w-3.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Cloud sync not configured
            </TooltipContent>
          </Tooltip>
        )}

        {remoteNewerAvailable && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onLoadRemote}
                className={`inline-flex items-center ${TONE_CLASS.info} hover:opacity-80`}
                aria-label="Newer version available in cloud"
              >
                <CloudDownload className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Newer version available in cloud — click to load
            </TooltipContent>
          </Tooltip>
        )}
      </span>
    </TooltipProvider>
  );
};
