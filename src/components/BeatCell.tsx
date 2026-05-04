import { Circle, Dot } from "lucide-react";
import type { Beat } from "@/lib/composer-state";
import { useSettings } from "@/lib/settings";
import { NoteGlyph } from "./NoteGlyph";

interface UnifiedBeatCellProps {
  beat: Beat;
  isSelected: boolean;
  onSelect: () => void;
}

export function BeatCell({ beat, isSelected, onSelect }: UnifiedBeatCellProps) {
  const { settings } = useSettings();
  const isEmpty = beat.length === 0;

  return (
    <button
      type="button"
      className={`aspect-[7/9] w-full flex items-center justify-center rounded transition-all relative
        ${isSelected ? "ring-2 ring-ring bg-accent z-50" : "hover:bg-secondary"}
        ${isEmpty ? "text-beat-empty" : ""}
        cursor-pointer select-none p-0`}
      onClick={onSelect}
    >
      {isEmpty ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <Dot />
        </span>
      ) : (
        <>
          <span className="absolute inset-0 flex items-center justify-center">
            <Circle className="text-beat-empty" size={"80%"} strokeWidth={1} />
          </span>
          <NoteGlyph notes={beat} settings={settings} />
        </>
      )}
    </button>
  );
}
