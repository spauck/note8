import { decodeState, encodeState } from "./composer-state";

export interface SavedComposition {
  /** Stable identifier; assigned during gist sync. May be missing for
   *  compositions that have only ever lived locally. */
  id?: string;
  name: string;
  queryString: string;
  savedAt: number;
}

const STORAGE_KEY = "handpan-composer-saved";
const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/** 6-char alphanumeric id used to identify compositions across devices. */
export function generateCompositionId(): string {
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
  }
  return s;
}

export function listSavedCompositions(): SavedComposition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedComposition[];
  } catch {
    return [];
  }
}

export function writeSavedCompositions(list: SavedComposition[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function findCompositionById(
  id: string | null | undefined,
): SavedComposition | undefined {
  if (!id) return undefined;
  return listSavedCompositions().find((c) => c.id === id);
}

/** Save a composition. If `id` is provided and matches an existing record,
 *  that record is updated (allowing the name to change). Otherwise upserts
 *  by name. Does NOT mint a new id — those are assigned only during sync. */
export function saveComposition(
  name: string,
  queryString: string,
  id?: string | null,
): SavedComposition {
  const list = listSavedCompositions();
  let idx = -1;
  if (id) idx = list.findIndex((c) => c.id === id);
  if (idx < 0) idx = list.findIndex((c) => !c.id && c.name === name);
  const base = idx >= 0 ? list[idx] : undefined;
  const entry: SavedComposition = {
    ...(base ?? {}),
    id: base?.id ?? id ?? undefined,
    name,
    queryString,
    savedAt: Date.now(),
  };
  if (idx >= 0) list[idx] = entry;
  else list.push(entry);
  writeSavedCompositions(list);
  return entry;
}

export function deleteComposition(target: SavedComposition): void {
  const list = listSavedCompositions().filter((c) =>
    target.id ? c.id !== target.id : !(c.name === target.name && !c.id),
  );
  writeSavedCompositions(list);
}

/** Whether a composition with this name exists that is NOT the one with
 *  the given id (used to detect overwrite collisions during rename). */
export function nameCollidesWith(
  name: string,
  excludeId?: string | null,
): boolean {
  return listSavedCompositions().some(
    (c) => c.name === name && (!excludeId || c.id !== excludeId),
  );
}

export function exportAllCompositions(): string {
  return JSON.stringify(listSavedCompositions(), null, 2);
}

export function importCompositions(json: string, overwrite = false): number {
  const incoming = JSON.parse(json) as SavedComposition[];
  if (!Array.isArray(incoming)) throw new Error("Invalid format");
  const existing = listSavedCompositions();
  // Index by id when available, otherwise by name.
  const keyOf = (c: SavedComposition) => c.id ?? `name:${c.name}`;
  const map = new Map(existing.map((c) => [keyOf(c), c]));
  let count = 0;
  for (const comp of incoming) {
    if (!comp.name || !comp.queryString) continue;
    const k = keyOf(comp);
    if (!map.has(k) || overwrite) {
      map.set(k, {
        ...comp,
        queryString: encodeState(decodeState(comp.queryString)),
      });
      count++;
    }
  }
  writeSavedCompositions(Array.from(map.values()));
  return count;
}
