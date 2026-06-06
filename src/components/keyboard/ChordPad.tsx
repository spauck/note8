import { useMemo } from "react";
import { inferChord, parseNote, parseScaleNotes, resolveNoteIds } from "@/lib/scale";
import type { Settings } from "@/lib/settings";
import { NoteGlyph } from "../NoteGlyph";
import type { Chord } from "./chords";

interface ChordPadProps {
  settings: Settings;
  chords: Chord[];
  currentChordKey: string | null;
  onTap: (chord: Chord) => void;
}

/** Row of chord buttons assembled from existing multi-note beats. */
export function ChordPad({
  settings,
  chords,
  currentChordKey,
  onTap,
}: ChordPadProps) {
  const { ding, scale } = useMemo(
    () => ({
      ding: parseNote(settings.scaleDing),
      scale: parseScaleNotes(settings.scaleNotes),
    }),
    [settings.scaleDing, settings.scaleNotes],
  );

  return (
    <>
      {chords.map((chord) => {
        const isCurrent = currentChordKey === chord.key;
        const resolved = resolveNoteIds(
          chord.notes.map((n) => n.value),
          ding,
          scale,
        );
        const label = inferChord(resolved, scale);
        return (
          <div key={chord.key} className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-mono text-muted-foreground h-3 leading-none">
              {label ?? ""}
            </span>
            <button
              type="button"
              onClick={() => onTap(chord)}
              className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-lg transition-colors border relative
                ${
                  isCurrent
                    ? "ring-2 ring-ring bg-accent border-ring"
                    : "bg-secondary hover:bg-accent border-border"
                }`}
              title={chord.notes
                .map((n) => `${n.hand[0].toUpperCase()}:${n.value}`)
                .join(", ")}
            >
              <NoteGlyph notes={chord.notes} settings={settings} />
            </button>
          </div>
        );
      })}
    </>
  );
}
