// Composition model: a flat array of Bars.
// Each Bar may have a `breakBefore` flag that begins a new row.
// The first bar implicitly starts the first row regardless of its flag.
// Encoding should try to only use URL-safe characters, and be as compact as possible while still being somewhat human-readable.
export type Hand = "right" | "left" | "any" | "none";
export type Note = { value: string; hand: Hand };
export type Beat = Note[];

export interface Bar {
  beats: Beat[];
  breakBefore: boolean;
}

export interface ComposerState {
  notesPerCount: number;
  bars: Bar[];
  /** Optional ding note (e.g. "D3"). When set together with `scaleNotes`,
   *  fully defines the composition's scale, overriding the active library
   *  scale. */
  ding?: string;
  /** Optional space-separated scale notes (e.g. "A3 A#3 C4 D4 E4 F4 G4 A4"). */
  scaleNotes?: string;
}

const DEFAULT_BEATS_PER_BAR = 4;

const DEFAULT_STATE: ComposerState = {
  notesPerCount: 1,
  bars: [{ beats: emptyBeats(DEFAULT_BEATS_PER_BAR), breakBefore: true }],
};

const beatSplit = ".";
const noteSplit = "-";
const barSplit = "_";
const breakBeforeFlag = "B";

function emptyBeats(n: number): Beat[] {
  return Array.from({ length: n }, () => []);
}

function encodeBeat(beat: Beat): string {
  if (!beat || !beat.length) return "";
  return beat.map((note) => handShort[note.hand] + note.value).join(noteSplit);
}

function decodeBeat(beatStr: string): Beat {
  const notes = beatStr.split(noteSplit).filter(Boolean);
  return notes.map((note) => ({
    value: note.slice(1),
    hand: shortHand[note[0]],
  }));
}

/** Encode a single bar: `[B]beat.beat.beat` */
function encodeBar(bar: Bar): string {
  const head = `${bar.breakBefore ? breakBeforeFlag : ""}`;
  return head + bar.beats.map(encodeBeat).join(beatSplit);
}

function decodeBar(barStr: string): Bar | null {
  if (barStr === undefined) {
    console.log("undefined barStr");
  }
  if (barStr === "") {
    return { beats: [[], []], breakBefore: false };
  }

  const m = barStr.match(/^\d*([!B]?)(.*)$/);
  if (!m) return null;
  // Should be `const breakBefore = m[1] === breakBeforeFlag`, but allow "!" for legacy URLs that used it by mistake.
  const breakBefore = m[1] !== "";
  const rest = m[2];
  const beatStrs = rest === "" ? [] : rest.split(beatSplit);
  const beats: Beat[] = beatStrs.map(decodeBeat);
  // Ensure at least 2 beats per bar
  if (beats[1] === undefined) {
    beats[1] = [];
  }
  return { beats, breakBefore };
}

export function encodeState(state: ComposerState): string {
  const bars = state.bars.map(encodeBar).join(barSplit);
  const parts = [`n=${state.notesPerCount}`];
  if (bars) parts.push(`bars=${encodeURIComponent(bars)}`);
  if (state.ding) parts.push(`ding=${encodeURIComponent(state.ding)}`);
  if (state.scaleNotes)
    parts.push(`scale=${encodeURIComponent(state.scaleNotes)}`);
  return parts.join("&");
}

export function decodeState(search: string): ComposerState {
  const params = new URLSearchParams(search);
  const n = parseInt(params.get("n") || "2", 10) || 2;
  const barsParam = params.get("bars");
  const ding = params.get("ding") || undefined;
  const scaleNotes = params.get("scale") || undefined;

  if (barsParam) {
    const bars = barsParam
      .split(/[_,]/)
      .map(decodeBar)
      .filter((b): b is Bar => b !== null);
    if (bars.length > 0) {
      // Ensure the very first bar starts a row.
      bars[0] = { ...bars[0], breakBefore: true };
      return { notesPerCount: n, bars, ding, scaleNotes };
    }
  }

  // ─── BEGIN LEGACY MIGRATION ─────────────────────────────────────────────
  // Old schema: b=beatsPerBar, r=barsPerRow, d=row (one per row, beats joined
  // by ".", with each row containing beatsPerBar*barsPerRow beats).
  // Remove this block once no legacy URLs/saves are in circulation.
  const legacyB = parseInt(params.get("b") || "", 10);
  const legacyR = parseInt(params.get("r") || "", 10);
  const legacyD = params.getAll("d");
  if (legacyB && legacyR && legacyD.length > 0) {
    const bars: Bar[] = [];
    for (const rowStr of legacyD) {
      const allBeats = rowStr.split(beatSplit).map(decodeBeat);
      for (let bi = 0; bi < legacyR; bi++) {
        const beats: Beat[] = Array.from(
          { length: legacyB },
          (_, i): Beat => allBeats[bi * legacyB + i] ?? [],
        );
        bars.push({ beats, breakBefore: bi === 0 });
      }
    }
    if (bars.length > 0) {
      bars[0] = { ...bars[0], breakBefore: true };
      return { notesPerCount: n, bars, ding, scaleNotes };
    }
  }
  // ─── END LEGACY MIGRATION ───────────────────────────────────────────────

  return {
    notesPerCount: n,
    bars: [{ beats: emptyBeats(DEFAULT_BEATS_PER_BAR), breakBefore: true }],
    ding,
    scaleNotes,
  };
}

/** Group bars into rows by their breakBefore flag. */
export function groupIntoRows(
  bars: Bar[],
): Array<{ start: number; bars: Bar[] }> {
  const rows: Array<{ start: number; bars: Bar[] }> = [];
  bars.forEach((bar, i) => {
    if (i === 0 || bar.breakBefore) {
      rows.push({ start: i, bars: [bar] });
    } else {
      rows[rows.length - 1].bars.push(bar);
    }
  });
  return rows;
}

/** Suggested length for a newly-added bar: last bar length, else rounded
 * average, else DEFAULT_BEATS_PER_BAR. */
export function nextBarLength(bars: Bar[]): number {
  if (bars.length === 0) return DEFAULT_BEATS_PER_BAR;
  const last = bars[bars.length - 1].beats.length;
  if (last) return last;
  const total = bars.reduce((s, b) => s + b.beats.length, 0);
  if (total > 0) return Math.max(1, Math.round(total / bars.length));
  return DEFAULT_BEATS_PER_BAR;
}

export function createEmptyBar(length: number, breakBefore = false): Bar {
  return { beats: emptyBeats(length), breakBefore };
}

export function resizeBar(bar: Bar, length: number): Bar {
  if (length < 1) return bar;
  const beats: Beat[] = Array.from(
    { length },
    (_, i): Beat => bar.beats[i] ?? [],
  );
  return { ...bar, beats };
}

export const shortHand: Record<string, Hand> = {
  r: "right",
  l: "left",
  a: "any",
  n: "none",
};

export const handShort: Record<Hand, string> = {
  right: "r",
  left: "l",
  any: "a",
  none: "n",
};

export { DEFAULT_STATE, DEFAULT_BEATS_PER_BAR };
