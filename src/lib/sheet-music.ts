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

export type Accidental = "" | "#" | "b";

export interface StaffNote {
  semitone: number;
  letter: string;
  accidental: Accidental;
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

// ---------------------------------------------------------------------------
// Major-key spelling (independent of the handpan scale)
// ---------------------------------------------------------------------------

export const MAJOR_KEYS = [
  "C",
  "G",
  "D",
  "A",
  "E",
  "B",
  "F#",
  "Db",
  "Ab",
  "Eb",
  "Bb",
  "F",
] as const;

export type MajorKey = (typeof MAJOR_KEYS)[number];

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_PC: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};
const MAJOR_OFFSETS = [0, 2, 4, 5, 7, 9, 11];
const SHARP_ORDER = ["F", "C", "G", "D", "A", "E", "B"];
const FLAT_ORDER = ["B", "E", "A", "D", "G", "C", "F"];

export interface KeySpelling {
  key: MajorKey;
  /** pitch class -> preferred spelling in this key */
  map: Record<number, { letter: string; accidental: Accidental }>;
  /** letter -> accidental implied by the key signature */
  signature: Record<string, Accidental>;
  /** Letters of the key signature, in conventional display order. */
  sigLetters: string[];
  sigAccidental: Accidental;
}

/** Build the spelling table (and key signature) for a major key. */
export function keySpelling(key: MajorKey): KeySpelling {
  const tonicLetter = key[0];
  const tonicAcc = (key[1] ?? "") as Accidental;
  const tonicIdx = LETTERS.indexOf(tonicLetter);
  const tonicPc =
    (NATURAL_PC[tonicLetter] + (tonicAcc === "#" ? 1 : tonicAcc === "b" ? -1 : 0) + 12) %
    12;

  const map: Record<number, { letter: string; accidental: Accidental }> = {};
  const signature: Record<string, Accidental> = {};
  for (let i = 0; i < 7; i++) {
    const letter = LETTERS[(tonicIdx + i) % 7];
    const pc = (tonicPc + MAJOR_OFFSETS[i]) % 12;
    const diff = ((pc - NATURAL_PC[letter] + 18) % 12) - 6;
    const accidental: Accidental = diff === 1 ? "#" : diff === -1 ? "b" : "";
    map[pc] = { letter, accidental };
    signature[letter] = accidental;
  }

  const sharpCount = Object.values(signature).filter((a) => a === "#").length;
  const flatCount = Object.values(signature).filter((a) => a === "b").length;
  const sharpKey = sharpCount >= flatCount;
  const sigAccidental: Accidental = sharpCount > 0 ? "#" : flatCount > 0 ? "b" : "";
  const sigLetters = (sharpCount > 0 ? SHARP_ORDER : FLAT_ORDER).filter(
    (l) => signature[l] === sigAccidental && sigAccidental !== "",
  );

  // Fill in the chromatic notes that are not part of the key.
  for (let pc = 0; pc < 12; pc++) {
    if (map[pc]) continue;
    if (sharpKey) {
      const below = LETTERS.find((l) => NATURAL_PC[l] === (pc + 11) % 12);
      if (below) {
        map[pc] = { letter: below, accidental: "#" };
        continue;
      }
    }
    const above = LETTERS.find((l) => NATURAL_PC[l] === (pc + 1) % 12);
    if (above) map[pc] = { letter: above, accidental: "b" };
    else map[pc] = SHARP_SPELLING[pc];
  }

  return { key, map, signature, sigLetters, sigAccidental };
}

/** Spell a semitone using a major key's preferred letters. */
export function spellSemitoneInKey(
  semitone: number,
  spelling: KeySpelling,
): StaffNote {
  const pc = ((semitone % 12) + 12) % 12;
  const { letter, accidental } = spelling.map[pc];
  const offset = accidental === "#" ? 1 : accidental === "b" ? -1 : 0;
  const base = Math.floor(semitone / 12);
  let octave = base;
  for (const cand of [base, base - 1, base + 1]) {
    if (cand * 12 + NATURAL_PC[letter] + offset === semitone) {
      octave = cand;
      break;
    }
  }
  return {
    semitone,
    letter,
    accidental,
    octave,
    step: octave * 7 + DIATONIC[letter],
    label: `${letter}${accidental}${octave}`,
  };
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
