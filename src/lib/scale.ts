// Parse handpan scale strings and infer chord names from sets of note IDs.

const PITCH_CLASS: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const NOTE_RE = /^([A-G])([#b]?)([0-9]?)$/;

export interface ParsedNote {
  raw: string;
  letter: string;
  accidental: "" | "#" | "b";
  octave: number;
  pitchClass: number; // 0-11
  semitone: number; // absolute = octave*12 + pitchClass
}

export function parseNote(raw: string): ParsedNote | null {
  const m = raw.trim().match(NOTE_RE);
  if (!m) return null;
  const letter = m[1];
  const accidental = (m[2] || "") as "" | "#" | "b";
  const octave = m[3] === "" ? 4 : parseInt(m[3], 10);
  let pc = PITCH_CLASS[letter];
  if (accidental === "#") pc = (pc + 1) % 12;
  else if (accidental === "b") pc = (pc + 11) % 12;
  return {
    raw,
    letter,
    accidental,
    octave,
    pitchClass: pc,
    semitone: octave * 12 + pc,
  };
}

export function parseScaleNotes(scaleNotes: string): ParsedNote[] {
  return scaleNotes
    .split(/\s+/)
    .filter(Boolean)
    .map(parseNote)
    .filter((n): n is ParsedNote => n !== null);
}

/** Resolve note IDs ("0" = ding, "1".. = scale positions) to parsed notes. */
export function resolveNoteIds(
  ids: string[],
  ding: ParsedNote | null,
  scale: ParsedNote[],
): ParsedNote[] {
  const out: ParsedNote[] = [];
  for (const id of ids) {
    const n = parseInt(id, 10);
    if (Number.isNaN(n)) continue;
    if (n === 0) {
      if (ding) out.push(ding);
    } else if (n >= 1 && n <= scale.length) {
      out.push(scale[n - 1]);
    }
  }
  return out;
}

const CHORD_PATTERNS: Array<{ intervals: number[]; suffix: string }> = [
  { intervals: [0, 4, 7], suffix: "" }, // major
  { intervals: [0, 3, 7], suffix: "m" }, // minor
  { intervals: [0, 3, 6], suffix: "dim" }, // diminished
  { intervals: [0, 4, 8], suffix: "aug" }, // augmented
  { intervals: [0, 7], suffix: "5" }, // power
];

const SHARP_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

function pcName(pc: number, scale: ParsedNote[]): string {
  // Prefer spelling from the scale if available
  const match = scale.find((n) => n.pitchClass === pc);
  if (match) return match.letter + match.accidental;
  return SHARP_NAMES[pc];
}

/** Infer a chord label from a set of pitch classes. Returns null if no match. */
export function inferChord(
  notes: ParsedNote[],
  scale: ParsedNote[],
): string | null {
  const pcs = Array.from(new Set(notes.map((n) => n.pitchClass)));
  if (pcs.length < 2) return null;

  for (const root of pcs) {
    const intervals = pcs
      .map((pc) => (pc - root + 12) % 12)
      .sort((a, b) => a - b);
    for (const pattern of CHORD_PATTERNS) {
      if (
        intervals.length === pattern.intervals.length &&
        intervals.every((v, i) => v === pattern.intervals[i])
      ) {
        return pcName(root, scale) + pattern.suffix;
      }
    }
  }
  return null;
}
