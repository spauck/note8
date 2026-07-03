/** biome-ignore-all lint/suspicious/noArrayIndexKey: because */

import { useMemo } from "react";
import { detectBarChords } from "@/lib/bar-chords";
import type { Bar } from "@/lib/composer-state";
import { parseNote, parseScaleNotes } from "@/lib/scale";
import { useSettings } from "@/lib/settings";
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
  const { settings } = useSettings();
  const beatCount = bar.beats.length;
  const gridTemplateColumns = `repeat(${beatCount}, 1fr)`;

  const barChords = useMemo(() => {
    if (!settings.detectBarChords) return [];
    const ding = parseNote(settings.scaleDing);
    const scale = parseScaleNotes(settings.scaleNotes);
    return detectBarChords(bar, ding, scale);
  }, [
    settings.detectBarChords,
    settings.scaleDing,
    settings.scaleNotes,
    bar,
  ]);

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
      {/* Chord labels header — one row spanning the whole bar */}
      {barChords.length > 0 && (
        <div
          style={{ gridColumn: `span ${beatCount}` }}
          className="flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-0 px-1 mb-0.5"
          title="Detected chords in this bar"
        >
          {barChords.map((c, i) => (
            <span
              key={`${c.label}-${i}`}
              className="text-[10px] font-mono text-muted-foreground leading-tight"
            >
              {c.label}
            </span>
          ))}
        </div>
      )}

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
            style={{ containerType: "inline-size" }}
          >
            <span
              className={`font-mono leading-none ${
                subIdx === 0
                  ? "text-muted-foreground font-semibold"
                  : "text-muted-foreground/50"
              }`}
              style={{ fontSize: "clamp(8px, 38cqw, 20px)" }}
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

      {/* Underlines: one row per detected chord, marking contributing beats */}
      {barChords.map((c, ci) => {
        const contributes = new Set(c.beatIndices);
        return (
          <div
            key={`u-${barIdx}-${ci}`}
            style={{
              gridColumn: `span ${beatCount}`,
              gridTemplateColumns,
            }}
            className="grid mt-0.5"
          >
            {bar.beats.map((_, beatIdx) => (
              <div
                key={`us-${barIdx}-${ci}-${beatIdx}`}
                className="h-0.5 mx-1 rounded-full"
                style={{
                  backgroundColor: contributes.has(beatIdx)
                    ? "hsl(var(--foreground) / 0.35)"
                    : "transparent",
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
