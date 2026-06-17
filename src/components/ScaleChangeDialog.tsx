import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ComposerState } from "@/lib/composer-state";
import { parseNote, parseScaleNotes } from "@/lib/scale";
import type { SavedScale } from "@/lib/scale-library";

interface ScaleChangeDialogProps {
  open: boolean;
  target: SavedScale | null;
  state: ComposerState;
  fromDing: string;
  fromNotes: string;
  onCancel: () => void;
  onApplyOnly: (target: SavedScale) => void;
  onTranspose: (target: SavedScale) => void;
}

/** Count how many notes in the composition would NOT map to an exact
 *  semitone in the target scale during a transpose. */
function countLossy(
  state: ComposerState,
  fromDing: string,
  fromNotes: string,
  target: SavedScale,
): { total: number; lossy: number; dropped: number } {
  const fDing = parseNote(fromDing);
  const fScale = parseScaleNotes(fromNotes);
  const tDing = parseNote(target.ding);
  const tScale = parseScaleNotes(target.notes);
  const refFrom = fDing ?? fScale[0];
  const refTo = tDing ?? tScale[0];

  let total = 0;
  let lossy = 0;
  let dropped = 0;

  for (const bar of state.bars) {
    for (const beat of bar.beats) {
      for (const note of beat) {
        const n = parseInt(note.value, 10);
        if (Number.isNaN(n)) continue;
        total++;
        if (n === 0) {
          if (!tDing) dropped++;
          continue;
        }
        if (n < 1 || n > fScale.length) {
          dropped++;
          continue;
        }
        const sourceNote = fScale[n - 1];
        if (!refFrom || !refTo) {
          if (n > tScale.length) dropped++;
          else lossy++;
          continue;
        }
        const interval = sourceNote.semitone - refFrom.semitone;
        const targetSemi = refTo.semitone + interval;
        const exact = tScale.findIndex((t) => t.semitone === targetSemi);
        if (exact >= 0) continue;
        if (n <= tScale.length) lossy++;
        else dropped++;
      }
    }
  }
  return { total, lossy, dropped };
}

export function ScaleChangeDialog({
  open,
  target,
  state,
  fromDing,
  fromNotes,
  onCancel,
  onApplyOnly,
  onTranspose,
}: ScaleChangeDialogProps) {
  const stats = useMemo(
    () =>
      target
        ? countLossy(state, fromDing, fromNotes, target)
        : { total: 0, lossy: 0, dropped: 0 },
    [target, state, fromDing, fromNotes],
  );

  const hasLoss = stats.lossy > 0 || stats.dropped > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change scale to {target?.name}?</DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block">
              <strong>Change scale only</strong> keeps every beat at its current
              scale position — the same buttons play the new scale's notes.
            </span>
            <span className="block">
              <strong>Transpose</strong> remaps each note to the nearest
              equivalent in the new scale by interval from the ding.
            </span>
            {hasLoss && target && (
              <span className="block mt-2 rounded border border-destructive/40 bg-destructive/10 p-2 text-destructive">
                Heads up: transposing into <em>{target.name}</em> is lossy.{" "}
                {stats.lossy > 0 && (
                  <>
                    {stats.lossy} note{stats.lossy === 1 ? "" : "s"} won't have
                    an exact pitch match and will fall back to the same scale
                    position.{" "}
                  </>
                )}
                {stats.dropped > 0 && (
                  <>
                    {stats.dropped} note{stats.dropped === 1 ? "" : "s"} can't
                    be mapped at all and will be dropped.
                  </>
                )}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => target && onApplyOnly(target)}
          >
            Change scale only
          </Button>
          <Button
            variant={hasLoss ? "destructive" : "default"}
            onClick={() => target && onTranspose(target)}
          >
            {hasLoss ? "Transpose anyway" : "Transpose"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
