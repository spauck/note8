import { useMemo } from "react";
import { handColor } from "@/components/handColor";
import type { Bar, Hand } from "@/lib/composer-state";
import { groupIntoRows } from "@/lib/composer-state";
import { parseNote, parseScaleNotes } from "@/lib/scale";
import {
  type MajorKey,
  type StaffNote,
  keySpelling,
  spellSemitoneInKey,
} from "@/lib/sheet-music";

interface SheetMusicViewProps {
  bars: Bar[];
  /** Root (ding) note of the scale to render with, e.g. "D3". */
  ding: string;
  /** Space-separated scale notes, in ascending order. */
  scaleNotes: string;
  /** Major key used for spelling and the key signature. */
  sheetKey: MajorKey;
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

/** A sounding event: notes held for `dur` beat slots. */
interface Event {
  slot: number;
  x: number;
  dur: number;
  notes: PlacedNote[];
}

interface Rest {
  slot: number;
  x: number;
  dur: number;
}

/** Bottom-line diatonic step for each clef. */
const CLEF = {
  treble: { bottomStep: 30, glyph: "\u{1D11E}", centerStep: 34 },
  bass: { bottomStep: 18, glyph: "\u{1D122}", centerStep: 22 },
} as const;

const REST_CHUNKS = [8, 6, 4, 3, 2, 1];

function splitRest(len: number): number[] {
  const out: number[] = [];
  let left = len;
  while (left > 0) {
    const chunk = REST_CHUNKS.find((c) => c <= left) ?? 1;
    out.push(chunk);
    left -= chunk;
  }
  return out;
}

/** Rest glyph for a duration in eighth-note slots. */
function restGlyph(dur: number): { glyph: string; dotted: boolean } {
  if (dur >= 8) return { glyph: "\u{1D13B}", dotted: false }; // whole
  if (dur >= 6) return { glyph: "\u{1D13C}", dotted: true }; // dotted half
  if (dur >= 4) return { glyph: "\u{1D13C}", dotted: false }; // half
  if (dur === 3) return { glyph: "\u{1D13D}", dotted: true }; // dotted quarter
  if (dur === 2) return { glyph: "\u{1D13D}", dotted: false }; // quarter
  return { glyph: "\u{1D13E}", dotted: false }; // eighth
}

/** Note shape for a duration in eighth-note slots. */
function noteShape(dur: number) {
  if (dur >= 8) return { hollow: true, stem: false, flag: false, dotted: false };
  if (dur >= 6) return { hollow: true, stem: true, flag: false, dotted: true };
  if (dur >= 4) return { hollow: true, stem: true, flag: false, dotted: false };
  if (dur === 3) return { hollow: false, stem: true, flag: false, dotted: true };
  if (dur === 2) return { hollow: false, stem: true, flag: false, dotted: false };
  return { hollow: false, stem: true, flag: true, dotted: false };
}

export function SheetMusicView({
  bars,
  ding,
  scaleNotes,
  sheetKey,
}: SheetMusicViewProps) {
  const rows = useMemo(() => groupIntoRows(bars), [bars]);
  const spelling = useMemo(() => keySpelling(sheetKey), [sheetKey]);

  const contentLeft = LEFT + spelling.sigLetters.length * 8 + 18;

  const { rowData, clef } = useMemo(() => {
    const dingNote = parseNote(ding);
    const scale = parseScaleNotes(scaleNotes);

    const resolve = (value: string): StaffNote | null => {
      const n = parseInt(value, 10);
      if (Number.isNaN(n)) return null;
      const semi =
        n === 0 ? dingNote?.semitone : scale[n - 1]?.semitone;
      return semi === undefined ? null : spellSemitoneInKey(semi, spelling);
    };

    const allSteps: number[] = [];
    const rowData = rows.map((row) => {
      const events: Event[] = [];
      const rests: Rest[] = [];
      const barStarts: number[] = [];
      let slot = 0;
      for (const bar of row.bars) {
        barStarts.push(slot);
        const barStart = slot;
        const len = bar.beats.length;
        // Onsets within this bar.
        const onsets: Array<{ i: number; notes: PlacedNote[] }> = [];
        bar.beats.forEach((beat, i) => {
          const notes: PlacedNote[] = [];
          for (const note of beat) {
            const placed = resolve(note.value);
            if (placed) {
              notes.push({ ...placed, hand: note.hand });
              allSteps.push(placed.step);
            }
          }
          if (notes.length) onsets.push({ i, notes });
        });

        if (onsets.length === 0) {
          for (const dur of splitRest(len)) {
            rests.push({
              slot: barStart + (len - dur),
              x: contentLeft + (barStart + len - dur) * BEAT_W + BEAT_W / 2,
              dur,
            });
          }
        } else {
          // Leading rest before the first onset.
          let cursor = 0;
          for (const dur of splitRest(onsets[0].i)) {
            rests.push({
              slot: barStart + cursor,
              x: contentLeft + (barStart + cursor) * BEAT_W + BEAT_W / 2,
              dur,
            });
            cursor += dur;
          }
          onsets.forEach((onset, k) => {
            const next = onsets[k + 1]?.i ?? len;
            events.push({
              slot: barStart + onset.i,
              x: contentLeft + (barStart + onset.i) * BEAT_W + BEAT_W / 2,
              dur: next - onset.i,
              notes: onset.notes,
            });
          });
        }
        slot += len;
      }
      return {
        events,
        rests,
        barStarts,
        beatCount: slot,
        beatsPerBar: row.bars[0]?.beats.length ?? 8,
      };
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
    return { rowData, clef };
  }, [rows, ding, scaleNotes, spelling, contentLeft]);

  const { bottomStep, glyph } = CLEF[clef];
  const yFor = (step: number) =>
    STAFF_TOP + STAFF_H - (step - bottomStep) * STEP;

  // Key-signature accidental positions: closest occurrence of the letter to
  // the middle of the staff.
  const sigPositions = spelling.sigLetters.map((letter, i) => {
    const letterIdx = ["C", "D", "E", "F", "G", "A", "B"].indexOf(letter);
    const center = bottomStep + 4;
    let step = Math.floor(center / 7) * 7 + letterIdx;
    if (step < bottomStep + 1) step += 7;
    if (step > bottomStep + 8) step -= 7;
    return { letter, step, x: LEFT - 12 + i * 8 };
  });

  return (
    <div className="space-y-4 max-w-3xl">
      {rowData.map((row, rowIdx) => {
        const width = contentLeft + row.beatCount * BEAT_W + 12;
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
              y={
                clef === "treble"
                  ? STAFF_TOP + STAFF_H + 6
                  : STAFF_TOP + 4 * STEP + 4
              }
              fontSize={clef === "treble" ? 44 : 34}
              fill="hsl(var(--foreground))"
            >
              {glyph}
            </text>

            {/* key signature */}
            {sigPositions.map((s) => (
              <text
                key={s.letter}
                x={s.x}
                y={yFor(s.step) + 4}
                fontSize={13}
                textAnchor="middle"
                fill="hsl(var(--foreground))"
              >
                {spelling.sigAccidental === "#" ? "\u266F" : "\u266D"}
              </text>
            ))}

            {/* time signature */}
            <text
              x={contentLeft - 12}
              y={STAFF_TOP + 2 * STEP + 4}
              fontSize={15}
              textAnchor="middle"
              fill="hsl(var(--foreground))"
            >
              {row.beatsPerBar}
            </text>
            <text
              x={contentLeft - 12}
              y={STAFF_TOP + 6 * STEP + 4}
              fontSize={15}
              textAnchor="middle"
              fill="hsl(var(--foreground))"
            >
              8
            </text>

            {/* bar lines */}
            {row.barStarts.map((start) => (
              <line
                key={`bar-${start}`}
                x1={contentLeft + start * BEAT_W}
                x2={contentLeft + start * BEAT_W}
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

            {/* rests */}
            {row.rests.map((rest) => {
              const r = restGlyph(rest.dur);
              return (
                <g key={`rest-${rest.slot}-${rest.dur}`}>
                  <text
                    x={rest.x}
                    y={STAFF_TOP + 5 * STEP}
                    fontSize={26}
                    textAnchor="middle"
                    fill="hsl(var(--muted-foreground))"
                  >
                    {r.glyph}
                  </text>
                  {r.dotted && (
                    <circle
                      cx={rest.x + 10}
                      cy={STAFF_TOP + 4 * STEP}
                      r={1.5}
                      fill="hsl(var(--muted-foreground))"
                    />
                  )}
                </g>
              );
            })}

            {/* notes */}
            {row.events.map((event) => {
              const shape = noteShape(event.dur);
              return event.notes.map((note, noteIdx) => {
                const y = yFor(note.step);
                const color = handColor(note.hand);
                const stemUp = note.step < bottomStep + 4;
                const ledgers: number[] = [];
                for (let s = bottomStep + 10; s <= note.step; s += 2) {
                  ledgers.push(s);
                }
                for (let s = bottomStep - 2; s >= note.step; s -= 2) {
                  ledgers.push(s);
                }
                const stemX = stemUp ? event.x + 5.5 : event.x - 5.5;
                const stemEnd = stemUp ? y - 26 : y + 26;
                return (
                  <g key={`${event.slot}-${noteIdx}-${note.label}`}>
                    {ledgers.map((s) => (
                      <line
                        key={s}
                        x1={event.x - 9}
                        x2={event.x + 9}
                        y1={yFor(s)}
                        y2={yFor(s)}
                        stroke="hsl(var(--foreground))"
                        strokeWidth={0.8}
                        opacity={0.6}
                      />
                    ))}
                    {shape.stem && (
                      <line
                        x1={stemX}
                        x2={stemX}
                        y1={y}
                        y2={stemEnd}
                        stroke={color}
                        strokeWidth={1.2}
                      />
                    )}
                    {shape.flag && (
                      <path
                        d={
                          stemUp
                            ? `M ${stemX} ${stemEnd} q 7 4 6 12`
                            : `M ${stemX} ${stemEnd} q 7 -4 6 -12`
                        }
                        stroke={color}
                        strokeWidth={1.6}
                        fill="none"
                      />
                    )}
                    <ellipse
                      cx={event.x}
                      cy={y}
                      rx={5.6}
                      ry={4.2}
                      fill={shape.hollow ? "none" : color}
                      stroke={color}
                      strokeWidth={shape.hollow ? 1.4 : 0}
                      transform={`rotate(-20 ${event.x} ${y})`}
                    />
                    {shape.dotted && (
                      <circle cx={event.x + 10} cy={y} r={1.5} fill={color} />
                    )}
                    {note.accidental !== spelling.signature[note.letter] && (
                      <text
                        x={event.x - 10}
                        y={y + 3.5}
                        fontSize={11}
                        textAnchor="end"
                        fill={color}
                      >
                        {note.accidental === "#"
                          ? "\u266F"
                          : note.accidental === "b"
                            ? "\u266D"
                            : "\u266E"}
                      </text>
                    )}
                  </g>
                );
              });
            })}
          </svg>
        );
      })}
      <div className="h-12" />
    </div>
  );
}
