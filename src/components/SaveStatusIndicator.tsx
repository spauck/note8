import { Check, CloudOff, CloudUpload, HardDriveDownload, Loader2, PencilLine } from "lucide-react";
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

        {syncEnabled && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={`inline-flex items-center ${
                  syncing
                    ? TONE_CLASS.info
                    : dirty
                      ? TONE_CLASS.muted
                      : TONE_CLASS.ok
                }`}
                aria-label={
                  syncing
                    ? "Syncing with Gist"
                    : dirty
                      ? "Cloud sync pending next save"
                      : "Synced with Gist"
                }
              >
                {syncing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : dirty ? (
                  <CloudUpload className="h-3.5 w-3.5" />
                ) : (
                  <CloudUpload className="h-3.5 w-3.5" />
                )}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {syncing
                ? "Syncing with Gist…"
                : dirty
                  ? "Cloud sync pending next save"
                  : "Synced with Gist"}
            </TooltipContent>
          </Tooltip>
        )}

        {!syncEnabled && (
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
      </span>
    </TooltipProvider>
  );
};
