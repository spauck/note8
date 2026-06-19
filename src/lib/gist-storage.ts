import {
  generateCompositionId,
  listSavedCompositions,
  type SavedComposition,
  writeSavedCompositions,
} from "./composition-storage";
import {
  listScales,
  mergeScales,
  type SavedScale,
  writeScales,
} from "./scale-library";

const TOKEN_KEY = "handpan-gist-token";
const GIST_ID_KEY = "handpan-gist-id";
const GIST_FILENAME = "handpan-compositions.json";
const GIST_DESCRIPTION = "Handpan Composer compositions";




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

interface RemotePayload {
  compositions: SavedComposition[];
  scales: SavedScale[];
}

async function fetchRemote(
  token: string,
  gistId: string,
): Promise<RemotePayload> {
  const gist = await gh<GistResponse>(`/gists/${gistId}`, token);
  const file = gist.files[GIST_FILENAME] ?? Object.values(gist.files)[0];
  if (!file) return { compositions: [], scales: [] };
  let content = file.content;
  if (file.truncated && file.raw_url) {
    const r = await fetch(file.raw_url);
    content = await r.text();
  }
  try {
    const parsed = JSON.parse(content);
    // Legacy format: bare array of compositions.
    if (Array.isArray(parsed)) {
      return { compositions: parsed as SavedComposition[], scales: [] };
    }
    return {
      compositions: Array.isArray(parsed?.compositions)
        ? (parsed.compositions as SavedComposition[])
        : [],
      scales: Array.isArray(parsed?.scales)
        ? (parsed.scales as SavedScale[])
        : [],
    };
  } catch {
    return { compositions: [], scales: [] };
  }
}

async function writeRemote(
  token: string,
  gistId: string,
  payload: RemotePayload,
): Promise<void> {
  const body = JSON.stringify({
    files: {
      [GIST_FILENAME]: { content: JSON.stringify(payload, null, 2) },
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
  payload: RemotePayload,
): Promise<string> {
  const body = JSON.stringify({
    description: GIST_DESCRIPTION,
    public: false,
    files: {
      [GIST_FILENAME]: { content: JSON.stringify(payload, null, 2) },
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

  const nameToId = new Map<string, string>();
  for (const c of all) {
    if (c.id && !nameToId.has(c.name)) nameToId.set(c.name, c.id);
  }

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

  const out: SavedComposition[] = [];
  for (const c of byKey.values()) {
    out.push(c.id ? c : { ...c, id: generateCompositionId() });
  }
  return out.sort((x, y) => x.name.localeCompare(y.name));
}

export interface SyncResult {
  merged: SavedComposition[];
  mergedScales: SavedScale[];
  gistId: string;
  pulledCount: number;
  totalCount: number;
  /** Ids whose remote version was newer than (or absent from) the local copy
   *  AND whose content actually differs from the local copy. The caller can
   *  use this to prompt the user to load a fresher version. */
  remoteNewerIds: string[];
  /** Wall-clock time the sync completed; useful for displaying freshness. */
  syncedAt: number;
}

export async function syncWithGist(): Promise<SyncResult> {
  const token = getGistToken();
  if (!token) throw new Error("No GitHub token configured");

  const local = listSavedCompositions();
  const localScales = listScales();
  let gistId = getGistId();
  let remote: RemotePayload = { compositions: [], scales: [] };
  if (!gistId) {
    const found = await findExistingGist(token);
    if (found) {
      gistId = found;
      setGistId(found);
    }
  }
  if (gistId) {
    remote = await fetchRemote(token, gistId);
  }

  // Detect remote-newer entries BEFORE merging, so we can tell the caller.
  const localById = new Map(
    local.filter((c) => c.id).map((c) => [c.id as string, c]),
  );
  const remoteNewerIds: string[] = [];
  for (const r of remote.compositions) {
    if (!r.id) continue;
    const l = localById.get(r.id);
    if (!l) continue; // brand-new remote; not "newer than" something we have
    if (
      (r.savedAt ?? 0) > (l.savedAt ?? 0) &&
      r.queryString !== l.queryString
    ) {
      remoteNewerIds.push(r.id);
    }
  }

  const merged = mergeAndAssignIds(local, remote.compositions);
  const mergedScales = mergeScales(localScales, remote.scales);

  writeSavedCompositions(merged);
  writeScales(mergedScales);

  const payload: RemotePayload = {
    compositions: merged,
    scales: mergedScales,
  };

  if (!gistId) {
    gistId = await createGist(token, payload);
    setGistId(gistId);
  } else {
    await writeRemote(token, gistId, payload);
  }

  return {
    merged,
    mergedScales,
    gistId,
    pulledCount: remote.compositions.length,
    totalCount: merged.length,
    remoteNewerIds,
    syncedAt: Date.now(),
  };
}
