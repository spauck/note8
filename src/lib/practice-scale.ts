import { parseNote } from "./scale";

export interface PracticeNote {
  id: string;
  label: string;
  semitone: number;
  frequency: number;
}

/** Missing octaves follow the ascending scale, starting at the exact ding. */
export function resolvePracticeScale(ding: string, notes: string): PracticeNote[] {
  const root = parseNote(ding);
  if (!root) return [];
  const rootOctave = /\d$/.test(ding.trim()) ? root.octave : 3;
  let previous = rootOctave * 12 + root.pitchClass;
  const makeNote = (id: string, letter: string, accidental: string, semitone: number): PracticeNote => ({
    id,
    label: `${letter}${accidental}${Math.floor(semitone / 12)}`,
    semitone,
    frequency: 440 * 2 ** ((semitone - 57) / 12),
  });
  const result = [makeNote("0", root.letter, root.accidental, previous)];
  const occurrences = new Map<number, number>([[root.pitchClass, previous]]);
  for (const [index, raw] of notes.trim().split(/\s+/).filter(Boolean).entries()) {
    const note = parseNote(raw);
    if (!note) return [];
    let semitone = note.semitone;
    if (!/\d$/.test(raw)) {
      semitone = Math.floor(previous / 12) * 12 + note.pitchClass;
      while (semitone <= previous || semitone <= (occurrences.get(note.pitchClass) ?? -1)) semitone += 12;
    }
    result.push(makeNote(String(index + 1), note.letter, note.accidental, semitone));
    previous = semitone;
    occurrences.set(note.pitchClass, semitone);
  }
  return result;
}

export function choosePracticeNote(notes: PracticeNote[], previousId?: string): PracticeNote | undefined {
  const choices = notes.length > 1 ? notes.filter((note) => note.id !== previousId) : notes;
  return choices[Math.floor(Math.random() * choices.length)];
}