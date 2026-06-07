// CRUD for named handpan scales (saved to localStorage). The library is
// merged across devices via the same Gist used for compositions.

const STORAGE_KEY = "handpan-scales";
const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export interface SavedScale {
  id: string;
  name: string;
  ding: string;
  /** Space-separated note list, e.g. "A3 A#3 C4 D4 E4 F4 G4 A4" */
  notes: string;
  savedAt: number;
}

export function generateScaleId(): string {
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
  }
  return s;
}

export function listScales(): SavedScale[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedScale[]) : [];
  } catch {
    return [];
  }
}

export function writeScales(list: SavedScale[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function findScaleById(id: string | null | undefined): SavedScale | undefined {
  if (!id) return undefined;
  return listScales().find((s) => s.id === id);
}

export function findScaleByContent(
  ding: string,
  notes: string,
): SavedScale | undefined {
  const norm = (s: string) => s.trim().split(/\s+/).filter(Boolean).join(" ");
  const d = ding.trim();
  const n = norm(notes);
  return listScales().find((s) => s.ding.trim() === d && norm(s.notes) === n);
}

export function upsertScale(scale: Omit<SavedScale, "savedAt"> & { savedAt?: number }): SavedScale {
  const list = listScales();
  const idx = list.findIndex((s) => s.id === scale.id);
  const entry: SavedScale = { ...scale, savedAt: Date.now() };
  if (idx >= 0) list[idx] = entry;
  else list.push(entry);
  writeScales(list);
  return entry;
}

export function deleteScale(id: string): void {
  writeScales(listScales().filter((s) => s.id !== id));
}

/** First-run migration: if the library is empty and legacy scale settings
 *  exist, create a default scale entry from them. Returns its id (or null
 *  when there was nothing to migrate). */
export function ensureDefaultScale(
  legacyDing: string,
  legacyNotes: string,
  name = "Default",
): SavedScale {
  const existing = listScales();
  if (existing.length > 0) return existing[0];
  const entry: SavedScale = {
    id: generateScaleId(),
    name,
    ding: legacyDing,
    notes: legacyNotes,
    savedAt: Date.now(),
  };
  writeScales([entry]);
  return entry;
}

/** Merge two scale lists by id; newest savedAt wins. Mints ids for
 *  legacy id-less entries via content match, else fresh ids. */
export function mergeScales(a: SavedScale[], b: SavedScale[]): SavedScale[] {
  const all = [...a, ...b].filter((s) => s?.name && s?.notes);

  // First pass: build content-key → id from any entry that has an id.
  const contentKey = (s: SavedScale) => `${s.ding}|${s.notes.trim()}`;
  const contentToId = new Map<string, string>();
  for (const s of all) {
    if (s.id && !contentToId.has(contentKey(s))) {
      contentToId.set(contentKey(s), s.id);
    }
  }

  const byKey = new Map<string, SavedScale>();
  for (const s of all) {
    const id = s.id ?? contentToId.get(contentKey(s));
    const key = id ?? `content:${contentKey(s)}`;
    const candidate: SavedScale = id ? { ...s, id } : s;
    const existing = byKey.get(key);
    if (!existing || (candidate.savedAt ?? 0) > (existing.savedAt ?? 0)) {
      byKey.set(key, candidate);
    }
  }

  const out: SavedScale[] = [];
  for (const s of byKey.values()) {
    out.push(s.id ? s : { ...s, id: generateScaleId() });
  }
  return out.sort((x, y) => x.name.localeCompare(y.name));
}
