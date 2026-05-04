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
  return (
    <>
      {chords.map((chord) => {
        const isCurrent = currentChordKey === chord.key;
        return (
          <button
            type="button"
            key={chord.key}
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
        );
      })}
    </>
  );
}
