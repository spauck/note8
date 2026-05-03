/** biome-ignore-all lint/suspicious/noArrayIndexKey: because */

import type { Bar } from "@/lib/composer-state";
import { BeatCell } from "./BeatCell";

interface BarColumnProps {
  bar: Bar;
  barIdx: number;
  /** Absolute beat index (0-based) of this bar's first beat within the row. */
  startBeat: number;
  notesPerCount: number;
  viewMode?: boolean;
  isHighlighted: boolean;
  selectedBeatIdx: number | null;
  showDivider?: boolean;
  onSelectBeat: (beatIdx: number) => void;
}

function getCountLabels(beatNumber: number, notesPerCount: number): string[] {
  const num = String(beatNumber);
  switch (notesPerCount) {
    case 1:
      return [num];
    case 2:
      return [num, "."];
    case 3:
      return [num, "&", "."];
    case 4:
      return [num, ".", "&", "."];
    default:
      return [num, ...Array.from({ length: notesPerCount - 1 }, () => ".")];
  }
}

export function BarColumn({
  bar,
  barIdx,
  startBeat,
  notesPerCount,
  viewMode,
  isHighlighted,
  selectedBeatIdx,
  onSelectBeat,
  showDivider,
}: BarColumnProps) {
  const beatCount = bar.beats.length;
  const gridTemplateColumns = `repeat(${beatCount}, 1fr)`;

  return (
    <div
      className={`grid transition-colors 
        ${showDivider ? "border-r border-bar-divider border-1" : ""}
        ${
          !viewMode && isHighlighted
            ? " rounded-md bg-accent/30 ring-2 ring-accent border-none"
            : ""
        }`}
      style={{ gridTemplateColumns, gridColumn: `span ${beatCount}` }}
    >
      {/* Count labels */}
      {bar.beats.map((_, beatIdx) => {
        const absoluteBeat = startBeat + beatIdx;
        const countGroup = Math.floor(absoluteBeat / notesPerCount);
        const subIdx = absoluteBeat % notesPerCount;
        const labels = getCountLabels(countGroup + 1, notesPerCount);
        const label = labels[subIdx] || ".";
        return (
          <div
            key={`l-${barIdx}-${beatIdx}`}
            className="flex items-center justify-center mb-0.5"
          >
            <span
              className={`text-[12px] font-mono ${
                subIdx === 0
                  ? "text-muted-foreground font-semibold"
                  : "text-muted-foreground/50"
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}

      {/* Beats */}
      {bar.beats.map((beat, beatIdx) => (
        <BeatCell
          key={`b-${barIdx}-${beatIdx}`}
          beat={beat}
          isSelected={!viewMode && selectedBeatIdx === beatIdx}
          onSelect={() => onSelectBeat(beatIdx)}
        />
      ))}
    </div>
  );
}
