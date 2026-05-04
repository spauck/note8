import { Eraser } from "lucide-react";
import { useMemo, useState } from "react";
import type { Bar, Beat, Hand } from "@/lib/composer-state";
import { useSettings } from "@/lib/settings";
import { ChordPad } from "./keyboard/ChordPad";
import { extractChords, serializeChord } from "./keyboard/chords";
import { HandSelector } from "./keyboard/HandSelector";
import { KeyboardTabs } from "./keyboard/KeyboardTabs";
import { NotePad } from "./keyboard/NotePad";
import type { KeyboardTab } from "./keyboard/types";

interface SelectedCell {
  barIdx: number;
  beatIdx: number;
}

interface PositionKeyboardProps {
  selectedCell: SelectedCell | null;
  activeNotes: Array<{ value: string; hand: Hand }>;
  bars: Bar[];
  onAssignNote: (value: string, hand: Hand) => void;
  onRemoveNote: (value: string) => void;
  onClearAll: () => void;
  onSetBeat: (beat: Beat) => void;
}

export function PositionKeyboard({
  selectedCell,
  activeNotes,
  bars,
  onAssignNote,
  onRemoveNote,
  onClearAll,
  onSetBeat,
}: PositionKeyboardProps) {
  const { settings } = useSettings();
  const [tab, setTab] = useState<KeyboardTab>("notes");
  const [lastHand, setLastHand] = useState<Hand>("right");

  const chords = useMemo(() => extractChords(bars), [bars]);

  if (!selectedCell) return null;

  const activeMap = new Map(activeNotes.map((n) => [n.value, n.hand]));
  const totalNotes = activeNotes.length;

  const handleTap = (val: string) => {
    if (activeMap.has(val)) onRemoveNote(val);
    else onAssignNote(val, lastHand);
  };

  const currentChordKey = totalNotes > 0 ? serializeChord(activeNotes) : null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border px-3 py-2 safe-bottom">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-1 mb-1.5">
          <span className="text-[10px] text-muted-foreground">
            Bar {selectedCell.barIdx + 1}, Beat {selectedCell.beatIdx + 1}
          </span>
          {totalNotes > 0 && (
            <span className="text-[10px] text-muted-foreground ml-1">
              · {totalNotes} note{totalNotes !== 1 ? "s" : ""}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            {tab === "notes" && (
              <HandSelector value={lastHand} onChange={setLastHand} />
            )}
            <span className="w-px h-4 bg-border mx-0.5" />
            <KeyboardTabs
              tab={tab}
              onChange={setTab}
              chordCount={chords.length}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {tab === "notes" && (
            <NotePad
              settings={settings}
              activeMap={activeMap}
              onTap={handleTap}
            />
          )}

          {tab === "chords" && (
            <ChordPad
              settings={settings}
              chords={chords}
              currentChordKey={currentChordKey}
              onTap={(chord) => onSetBeat(chord.notes)}
            />
          )}

          {tab !== "chords" && (
            <button
              type="button"
              onClick={onClearAll}
              className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-lg bg-secondary hover:bg-destructive/20 text-muted-foreground hover:text-destructive font-mono text-sm transition-colors border border-border"
              title="Clear all notes"
            >
              <Eraser size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
