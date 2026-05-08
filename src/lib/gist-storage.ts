import {
  generateCompositionId,
  listSavedCompositions,
  type SavedComposition,
  writeSavedCompositions,
} from "./composition-storage";

const TOKEN_KEY = "handpan-gist-token";
const GIST_ID_KEY = "handpan-gist-id";
const GIST_FILENAME = "handpan-compositions.json";
const GIST_DESCRIPTION = "Handpan Composer compositions";

const STORAGE_KEY = "handpan-composer-saved";

export function getGistToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function setGistToken(token: string): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getGistId(): string {
  return localStorage.getItem(GIST_ID_KEY) ?? "";
}

export function setGistId(id: string): void {
  if (id) localStorage.setItem(GIST_ID_KEY, id);
  else localStorage.removeItem(GIST_ID_KEY);
}

interface GistFile {
  filename: string;
  content: string;
  truncated?: boolean;
  raw_url?: string;
}
interface GistResponse {
  id: string;
  files: Record<string, GistFile>;
}

async function gh<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

async function fetchRemoteCompositions(
  token: string,
  gistId: string,
): Promise<SavedComposition[]> {
  const gist = await gh<GistResponse>(`/gists/${gistId}`, token);
  const file = gist.files[GIST_FILENAME] ?? Object.values(gist.files)[0];
  if (!file) return [];
  let content = file.content;
  if (file.truncated && file.raw_url) {
    const r = await fetch(file.raw_url);
    content = await r.text();
  }
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? (parsed as SavedComposition[]) : [];
  } catch {
    return [];
  }
}

async function writeRemoteCompositions(
  token: string,
  gistId: string,
  comps: SavedComposition[],
): Promise<void> {
  const body = JSON.stringify({
    files: {
      [GIST_FILENAME]: { content: JSON.stringify(comps, null, 2) },
    },
  });
  await gh(`/gists/${gistId}`, token, { method: "PATCH", body });
}

/** Find an existing gist owned by the authenticated user that matches our
 *  description or filename. Lets multiple devices converge on the same gist
 *  without sharing an ID manually. */
async function findExistingGist(token: string): Promise<string | null> {
  // Page through user's gists (most users have <100, but be defensive).
  for (let page = 1; page <= 10; page++) {
    const gists = await gh<GistResponse[]>(
      `/gists?per_page=100&page=${page}`,
      token,
    );
    if (!gists.length) break;
    const match = gists.find(
      (g) =>
        (g as GistResponse & { description?: string }).description ===
          GIST_DESCRIPTION || !!g.files?.[GIST_FILENAME],
    );
    if (match) return match.id;
    if (gists.length < 100) break;
  }
  return null;
}

async function createGist(
  token: string,
  comps: SavedComposition[],
): Promise<string> {
  const body = JSON.stringify({
    description: GIST_DESCRIPTION,
    public: false,
    files: {
      [GIST_FILENAME]: { content: JSON.stringify(comps, null, 2) },
    },
  });
  const gist = await gh<GistResponse>(`/gists`, token, {
    method: "POST",
    body,
  });
  return gist.id;
}

/** Merge by id when both sides have one; fall back to name-based matching
 *  for legacy entries that haven't been assigned an id yet. After merging,
 *  every entry is guaranteed to have an id. */
function mergeAndAssignIds(
  a: SavedComposition[],
  b: SavedComposition[],
): SavedComposition[] {
  const all = [...a, ...b].filter((c) => c?.name && c?.queryString);

  // Pass 1: build a name -> id map from any entry that already has an id,
  // so id-less entries can adopt the matching id.
  const nameToId = new Map<string, string>();
  for (const c of all) {
    if (c.id && !nameToId.has(c.name)) nameToId.set(c.name, c.id);
  }

  // Pass 2: pick the newest entry per id (or per name when still id-less).
  const byKey = new Map<string, SavedComposition>();
  for (const c of all) {
    const id = c.id ?? nameToId.get(c.name);
    const key = id ?? `name:${c.name}`;
    const candidate: SavedComposition = id ? { ...c, id } : c;
    const existing = byKey.get(key);
    if (!existing || (candidate.savedAt ?? 0) > (existing.savedAt ?? 0)) {
      byKey.set(key, candidate);
    }
  }

  // Pass 3: mint ids for anything still missing one.
  const out: SavedComposition[] = [];
  for (const c of byKey.values()) {
    out.push(c.id ? c : { ...c, id: generateCompositionId() });
  }
  return out.sort((x, y) => x.name.localeCompare(y.name));
}

export interface SyncResult {
  merged: SavedComposition[];
  gistId: string;
  pulledCount: number;
  totalCount: number;
}

/** Bi-directional sync: read both local + gist, merge by newest savedAt,
 *  then write the merged set back to both. Creates a gist if none exists. */
export async function syncWithGist(): Promise<SyncResult> {
  const token = getGistToken();
  if (!token) throw new Error("No GitHub token configured");

  const local = listSavedCompositions();
  let gistId = getGistId();
  let remote: SavedComposition[] = [];
  if (!gistId) {
    // Try to discover an existing gist on this account before creating one.
    const found = await findExistingGist(token);
    if (found) {
      gistId = found;
      setGistId(found);
    }
  }
  if (gistId) {
    remote = await fetchRemoteCompositions(token, gistId);
  }
  const merged = mergeAndAssignIds(local, remote);

  // Write merged to local
  writeSavedCompositions(merged);

  // Write merged to gist (create if needed)
  if (!gistId) {
    gistId = await createGist(token, merged);
    setGistId(gistId);
  } else {
    await writeRemoteCompositions(token, gistId, merged);
  }

  return {
    merged,
    gistId,
    pulledCount: remote.length,
    totalCount: merged.length,
  };
}
