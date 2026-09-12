import { useMemo } from "react";
import { handColor } from "@/components/handColor";
import type { Bar, Hand } from "@/lib/composer-state";
import { groupIntoRows } from "@/lib/composer-state";
import { parseNote, parseScaleNotes } from "@/lib/scale";
import { type StaffNote, spellSemitone } from "@/lib/sheet-music";

interface SheetMusicViewProps {
  bars: Bar[];
  /** Root (ding) note of the scale to render with, e.g. "D3". */
  ding: string;
  /** Space-separated scale notes, in ascending order. */
  scaleNotes: string;
}

const LEFT = 56;
const BEAT_W = 34;
const STEP = 5; // half a staff space
const STAFF_TOP = 52;
const STAFF_H = 8 * STEP; // 4 spaces
const HEIGHT = STAFF_TOP + STAFF_H + 52;

interface PlacedNote extends StaffNote {
  hand: Hand;
}

interface PlacedBeat {
  x: number;
  notes: PlacedNote[];
}

/** Bottom-line diatonic step for each clef. */
const CLEF = {
  treble: { bottomStep: 30, glyph: "\u{1D11E}", centerStep: 34 },
  bass: { bottomStep: 18, glyph: "\u{1D122}", centerStep: 22 },
} as const;

export function SheetMusicView({
  bars,
  ding,
  scaleNotes,
}: SheetMusicViewProps) {
  const rows = useMemo(() => groupIntoRows(bars), [bars]);

  const { rowBeats, clef } = useMemo(() => {
    const dingNote = parseNote(ding);
    const scale = parseScaleNotes(scaleNotes);

    const resolve = (value: string): StaffNote | null => {
      const n = parseInt(value, 10);
      if (Number.isNaN(n)) return null;
      if (n === 0) return dingNote ? spellSemitone(dingNote.semitone) : null;
      const s = scale[n - 1];
      return s ? spellSemitone(s.semitone) : null;
    };

    const allSteps: number[] = [];
    const rowBeats = rows.map((row) => {
      const beats: PlacedBeat[] = [];
      let idx = 0;
      const barStarts: number[] = [];
      for (const bar of row.bars) {
        barStarts.push(idx);
        for (const beat of bar.beats) {
          const notes: PlacedNote[] = [];
          for (const note of beat) {
            const placed = resolve(note.value);
            if (placed) {
              notes.push({ ...placed, hand: note.hand });
              allSteps.push(placed.step);
            }
          }
          beats.push({ x: LEFT + idx * BEAT_W + BEAT_W / 2, notes });
          idx++;
        }
      }
      return { beats, barStarts, beatCount: idx };
    });

    let clef: keyof typeof CLEF = "bass";
    if (allSteps.length) {
      const sorted = [...allSteps].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      clef =
        Math.abs(median - CLEF.treble.centerStep) <
        Math.abs(median - CLEF.bass.centerStep)
          ? "treble"
          : "bass";
    }
    return { rowBeats, clef };
  }, [rows, ding, scaleNotes]);

  const { bottomStep, glyph } = CLEF[clef];
  const yFor = (step: number) => STAFF_TOP + STAFF_H - (step - bottomStep) * STEP;

  return (
    <div className="space-y-4">
      {rowBeats.map((row, rowIdx) => {
        const width = LEFT + row.beatCount * BEAT_W + 12;
        return (
          <svg
            // biome-ignore lint/suspicious/noArrayIndexKey: stable row order
            key={rowIdx}
            viewBox={`0 0 ${width} ${HEIGHT}`}
            className="w-full h-auto"
            role="img"
            aria-label={`Sheet music system ${rowIdx + 1}`}
          >
            {/* staff lines */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1={LEFT - 40}
                x2={width - 8}
                y1={STAFF_TOP + i * 2 * STEP}
                y2={STAFF_TOP + i * 2 * STEP}
                stroke="hsl(var(--foreground))"
                strokeWidth={0.8}
                opacity={0.6}
              />
            ))}

            {/* clef */}
            <text
              x={LEFT - 38}
              y={clef === "treble" ? STAFF_TOP + STAFF_H : STAFF_TOP + STAFF_H - 2 * STEP}
              fontSize={clef === "treble" ? 58 : 46}
              fill="hsl(var(--foreground))"
            >
              {glyph}
            </text>

            {/* bar lines */}
            {row.barStarts.map((start) => (
              <line
                key={`bar-${start}`}
                x1={LEFT + start * BEAT_W}
                x2={LEFT + start * BEAT_W}
                y1={STAFF_TOP}
                y2={STAFF_TOP + STAFF_H}
                stroke="hsl(var(--foreground))"
                strokeWidth={1}
                opacity={0.6}
              />
            ))}
            <line
              x1={width - 8}
              x2={width - 8}
              y1={STAFF_TOP}
              y2={STAFF_TOP + STAFF_H}
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              opacity={0.7}
            />

            {/* notes */}
            {row.beats.map((beat, beatIdx) =>
              beat.notes.map((note, noteIdx) => {
                const y = yFor(note.step);
                const color = handColor(note.hand);
                const stemUp = note.step < bottomStep + 4;
                // Ledger lines for notes outside the staff.
                const ledgers: number[] = [];
                for (let s = bottomStep + 10; s <= note.step; s += 2) {
                  ledgers.push(s);
                }
                for (let s = bottomStep - 2; s >= note.step; s -= 2) {
                  ledgers.push(s);
                }
                return (
                  <g key={`${beatIdx}-${noteIdx}-${note.label}`}>
                    {ledgers.map((s) => (
                      <line
                        key={s}
                        x1={beat.x - 9}
                        x2={beat.x + 9}
                        y1={yFor(s)}
                        y2={yFor(s)}
                        stroke="hsl(var(--foreground))"
                        strokeWidth={0.8}
                        opacity={0.6}
                      />
                    ))}
                    <line
                      x1={stemUp ? beat.x + 5.5 : beat.x - 5.5}
                      x2={stemUp ? beat.x + 5.5 : beat.x - 5.5}
                      y1={y}
                      y2={stemUp ? y - 26 : y + 26}
                      stroke={color}
                      strokeWidth={1.2}
                    />
                    <ellipse
                      cx={beat.x}
                      cy={y}
                      rx={5.6}
                      ry={4.2}
                      fill={color}
                      transform={`rotate(-20 ${beat.x} ${y})`}
                    />
                    {note.accidental && (
                      <text
                        x={beat.x - 10}
                        y={y + 3.5}
                        fontSize={11}
                        textAnchor="end"
                        fill={color}
                      >
                        &#9839;
                      </text>
                    )}
                  </g>
                );
              }),
            )}
          </svg>
        );
      })}
      <div className="h-12" />
    </div>
  );
}
