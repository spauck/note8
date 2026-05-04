import type { Bar, Hand } from "@/lib/composer-state";

/** A unique combination of notes with their hand assignments. */
export interface Chord {
  key: string;
  notes: Array<{ value: string; hand: Hand }>;
}

export function serializeChord(
  notes: Array<{ value: string; hand: Hand }>,
): string {
  return notes
    .map((n) => `${n.hand}:${n.value}`)
    .sort()
    .join("|");
}

/** Extract every distinct multi-note beat across all bars. */
export function extractChords(bars: Bar[]): Chord[] {
  const seen = new Map<string, Chord>();
  for (const bar of bars) {
    for (const notes of bar.beats) {
      if (notes.length < 2) continue;
      const key = serializeChord(notes);
      if (!seen.has(key)) {
        seen.set(key, { key, notes });
      }
    }
  }
  return Array.from(seen.values());
}
