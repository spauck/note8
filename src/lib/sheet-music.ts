// Helpers for rendering a composition as staff notation.

import { type ParsedNote, parseNote, parseScaleNotes } from "@/lib/scale";

const SHARP_SPELLING: Array<{ letter: string; accidental: "" | "#" }> = [
  { letter: "C", accidental: "" },
  { letter: "C", accidental: "#" },
  { letter: "D", accidental: "" },
  { letter: "D", accidental: "#" },
  { letter: "E", accidental: "" },
  { letter: "F", accidental: "" },
  { letter: "F", accidental: "#" },
  { letter: "G", accidental: "" },
  { letter: "G", accidental: "#" },
  { letter: "A", accidental: "" },
  { letter: "A", accidental: "#" },
  { letter: "B", accidental: "" },
];

const DIATONIC: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};

export interface StaffNote {
  semitone: number;
  letter: string;
  accidental: "" | "#";
  octave: number;
  /** Diatonic staff step: octave * 7 + letter index (C = 0). */
  step: number;
  label: string;
}

/** Spell an absolute semitone value (octave * 12 + pitch class) with sharps. */
export function spellSemitone(semitone: number): StaffNote {
  const octave = Math.floor(semitone / 12);
  const pc = ((semitone % 12) + 12) % 12;
  const { letter, accidental } = SHARP_SPELLING[pc];
  return {
    semitone,
    letter,
    accidental,
    octave,
    step: octave * 7 + DIATONIC[letter],
    label: `${letter}${accidental}${octave}`,
  };
}

export function toStaffNote(n: ParsedNote): StaffNote {
  return spellSemitone(n.semitone);
}

/** Chromatic note options for the root-note dropdown, inclusive range. */
export function rootNoteOptions(fromOctave = 2, toOctave = 5): string[] {
  const out: string[] = [];
  for (let o = fromOctave; o <= toOctave; o++) {
    for (const s of SHARP_SPELLING) {
      out.push(`${s.letter}${s.accidental}${o}`);
    }
  }
  return out;
}

/** Re-root a scale: keep every interval relative to the ding, but move the
 *  ding to `rootRaw`. Returns note strings ("D3" / "A3 A#3 ..."). */
export function rerootScale(
  ding: string,
  notes: string,
  rootRaw: string,
): { ding: string; notes: string } {
  const from = parseNote(ding);
  const to = parseNote(rootRaw);
  const scale = parseScaleNotes(notes);
  if (!from || !to) return { ding, notes };
  const shift = to.semitone - from.semitone;
  return {
    ding: spellSemitone(from.semitone + shift).label,
    notes: scale
      .map((n) => spellSemitone(n.semitone + shift).label)
      .join(" "),
  };
}
