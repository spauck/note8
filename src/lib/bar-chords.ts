import type { Bar } from "./composer-state";
import {
  CHORD_PATTERNS,
  type ParsedNote,
  pcName,
  resolveNoteIds,
} from "./scale";

export interface BarChord {
  /** Displayed chord label, e.g. "Cmaj7", "Am", "Dsus4". */
  label: string;
  /** Sorted pitch-class set that matched — used for subset filtering. */
  pcs: number[];
  /** Beat indices (within the bar) that contribute at least one note. */
  beatIndices: number[];
  /** Detection rank: prefer higher (more specific) chords. */
  rank: number;
}

/**
 * Detect every chord that can be assembled from the notes in a single bar.
 * A chord is considered present when every pitch class in its pattern appears
 * somewhere in the bar. Chords whose pitch-class set is a proper subset of
 * another detected chord's set are filtered out.
 */
export function detectBarChords(
  bar: Bar,
  ding: ParsedNote | null,
  scale: ParsedNote[],
): BarChord[] {
  // pitch class -> set of beat indices where it appears
  const pcBeats = new Map<number, Set<number>>();
  bar.beats.forEach((beat, bi) => {
    if (!beat.length) return;
    const resolved = resolveNoteIds(
      beat.map((n) => n.value),
      ding,
      scale,
    );
    for (const n of resolved) {
      if (!pcBeats.has(n.pitchClass))
        pcBeats.set(n.pitchClass, new Set());
      pcBeats.get(n.pitchClass)!.add(bi);
    }
  });

  const presentPcs = Array.from(pcBeats.keys());
  if (presentPcs.length < 2) return [];

  const presentSet = new Set(presentPcs);
  const matches: BarChord[] = [];
  const seen = new Set<string>();

  for (const root of presentPcs) {
    for (const pattern of CHORD_PATTERNS) {
      const chordPcs = pattern.intervals.map((iv) => (root + iv) % 12);
      if (!chordPcs.every((pc) => presentSet.has(pc))) continue;
      const sortedPcs = [...chordPcs].sort((a, b) => a - b);
      const key = `${pattern.suffix}|${sortedPcs.join(",")}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const beats = new Set<number>();
      for (const pc of chordPcs) {
        for (const bi of pcBeats.get(pc) ?? []) beats.add(bi);
      }
      matches.push({
        label: pcName(root, scale) + pattern.suffix,
        pcs: sortedPcs,
        beatIndices: Array.from(beats).sort((a, b) => a - b),
        rank: pattern.rank,
      });
    }
  }

  // Filter subsets: drop any chord whose pcs is a proper subset of another
  // chord's pcs. Ties (same pc set with different suffix — shouldn't happen)
  // resolved by keeping the higher rank.
  const kept: BarChord[] = [];
  for (const m of matches) {
    const isSubset = matches.some(
      (other) =>
        other !== m &&
        other.pcs.length > m.pcs.length &&
        m.pcs.every((pc) => other.pcs.includes(pc)),
    );
    if (!isSubset) kept.push(m);
  }

  // Stable order: by rank desc, then by earliest contributing beat.
  kept.sort(
    (a, b) =>
      b.rank - a.rank ||
      (a.beatIndices[0] ?? 0) - (b.beatIndices[0] ?? 0) ||
      a.label.localeCompare(b.label),
  );
  return kept;
}
