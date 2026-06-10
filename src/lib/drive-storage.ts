// Google Drive sync provider. Uses Google Identity Services (GIS) for OAuth
// in the browser (no client secret, no backend) and stores a single JSON
// blob in the app's sandboxed `appDataFolder` — invisible to the user's
// normal Drive UI and scoped to this app only.
//
// The developer must create an OAuth Client ID in Google Cloud Console
// (type: Web application) and authorise their deployment origin. End users
// then sign in with their own Google account; their data lives in their
// own Drive.

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

const CLIENT_ID_KEY = "handpan-drive-client-id";
const TOKEN_KEY = "handpan-drive-token"; // { access_token, expires_at }
const FILE_ID_KEY = "handpan-drive-file-id";
const SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const FILE_NAME = "handpan-compositions.json";
const GIS_SRC = "https://accounts.google.com/gsi/client";

interface CachedToken {
  access_token: string;
  expires_at: number;
}

interface RemotePayload {
  compositions: SavedComposition[];
  scales: SavedScale[];
}

// ---- Config ---------------------------------------------------------------

export function getDriveClientId(): string {
  return (
    localStorage.getItem(CLIENT_ID_KEY) ??
    (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ??
    ""
  );
}

export function setDriveClientId(id: string): void {
  if (id) localStorage.setItem(CLIENT_ID_KEY, id);
  else localStorage.removeItem(CLIENT_ID_KEY);
}

export function getDriveFileId(): string {
  return localStorage.getItem(FILE_ID_KEY) ?? "";
}

export function setDriveFileId(id: string): void {
  if (id) localStorage.setItem(FILE_ID_KEY, id);
  else localStorage.removeItem(FILE_ID_KEY);
}

function readCachedToken(): CachedToken | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw) as CachedToken;
    // Treat as expired 60s before the real expiry to avoid races.
    if (!t.access_token || t.expires_at < Date.now() + 60_000) return null;
    return t;
  } catch {
    return null;
  }
}

function writeCachedToken(t: CachedToken | null): void {
  if (t) localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
  else localStorage.removeItem(TOKEN_KEY);
}

export function isDriveSignedIn(): boolean {
  return !!readCachedToken();
}

export function signOutDrive(): void {
  writeCachedToken(null);
}

// ---- Google Identity Services loader -------------------------------------

interface TokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void;
}
interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}
interface GoogleNs {
  accounts: {
    oauth2: {
      initTokenClient: (cfg: {
        client_id: string;
        scope: string;
        callback: (resp: TokenResponse) => void;
        error_callback?: (err: unknown) => void;
      }) => TokenClient;
      revoke: (token: string, done?: () => void) => void;
    };
  };
}
declare global {
  interface Window {
    google?: GoogleNs;
  }
}

let gisLoading: Promise<void> | null = null;
function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisLoading) return gisLoading;
  gisLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Identity"));
    document.head.appendChild(s);
  });
  return gisLoading;
}

async function requestToken(opts: { interactive: boolean }): Promise<string> {
  const cached = readCachedToken();
  if (cached) return cached.access_token;

  const clientId = getDriveClientId();
  if (!clientId) {
    throw new Error(
      "Google Client ID not configured — add it in Settings → Google Drive.",
    );
  }
  await loadGis();
  return await new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error_description || resp.error || "Auth failed"));
          return;
        }
        const expiresIn = resp.expires_in ?? 3600;
        writeCachedToken({
          access_token: resp.access_token,
          expires_at: Date.now() + expiresIn * 1000,
        });
        resolve(resp.access_token);
      },
      error_callback: (err) =>
        reject(err instanceof Error ? err : new Error("Auth failed")),
    });
    client.requestAccessToken({ prompt: opts.interactive ? "" : "none" });
  });
}

/** Interactive sign-in (call from a click handler). */
export async function signInDrive(): Promise<void> {
  await requestToken({ interactive: true });
}

// ---- Drive API ------------------------------------------------------------

async function api<T>(
  path: string,
  init: RequestInit & { raw?: boolean } = {},
): Promise<T> {
  const token = await requestToken({ interactive: false });
  const res = await fetch(`https://www.googleapis.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body && !(init.body instanceof FormData) && !init.headers
        ? { "Content-Type": "application/json" }
        : {}),
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 401) {
    // Token rejected — clear and retry once interactively.
    writeCachedToken(null);
    throw new Error("Drive auth expired — sign in again.");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive API ${res.status}: ${text || res.statusText}`);
  }
  if (init.raw) return (await res.text()) as unknown as T;
  return (await res.json()) as T;
}

async function findFileId(): Promise<string | null> {
  const cached = getDriveFileId();
  if (cached) return cached;
  const res = await api<{ files: Array<{ id: string; name: string }> }>(
    `/drive/v3/files?spaces=appDataFolder&fields=files(id,name)&pageSize=10`,
  );
  const match = res.files.find((f) => f.name === FILE_NAME) ?? res.files[0];
  if (match) {
    setDriveFileId(match.id);
    return match.id;
  }
  return null;
}

async function fetchRemote(fileId: string): Promise<RemotePayload> {
  const text = await api<string>(
    `/drive/v3/files/${fileId}?alt=media`,
    { raw: true },
  );
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return { compositions: parsed as SavedComposition[], scales: [] };
    }
    return {
      compositions: Array.isArray(parsed?.compositions)
        ? parsed.compositions
        : [],
      scales: Array.isArray(parsed?.scales) ? parsed.scales : [],
    };
  } catch {
    return { compositions: [], scales: [] };
  }
}

function multipartBody(
  metadata: Record<string, unknown>,
  body: string,
): { body: string; contentType: string } {
  const boundary = `bnd_${Math.random().toString(36).slice(2)}`;
  const payload =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${body}\r\n` +
    `--${boundary}--`;
  return {
    body: payload,
    contentType: `multipart/related; boundary=${boundary}`,
  };
}

async function createFile(payload: RemotePayload): Promise<string> {
  const { body, contentType } = multipartBody(
    { name: FILE_NAME, parents: ["appDataFolder"] },
    JSON.stringify(payload, null, 2),
  );
  const res = await api<{ id: string }>(
    `/upload/drive/v3/files?uploadType=multipart&fields=id`,
    { method: "POST", body, headers: { "Content-Type": contentType } },
  );
  setDriveFileId(res.id);
  return res.id;
}

async function updateFile(
  fileId: string,
  payload: RemotePayload,
): Promise<void> {
  await api(
    `/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: "PATCH",
      body: JSON.stringify(payload, null, 2),
      headers: { "Content-Type": "application/json" },
    },
  );
}

// ---- Merge (mirrors gist-storage) ----------------------------------------

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

export interface DriveSyncResult {
  merged: SavedComposition[];
  mergedScales: SavedScale[];
  fileId: string;
  pulledCount: number;
  totalCount: number;
}

export async function syncWithDrive(): Promise<DriveSyncResult> {
  if (!getDriveClientId()) {
    throw new Error("Google Client ID not configured");
  }

  const local = listSavedCompositions();
  const localScales = listScales();

  let fileId = await findFileId();
  let remote: RemotePayload = { compositions: [], scales: [] };
  if (fileId) remote = await fetchRemote(fileId);

  const merged = mergeAndAssignIds(local, remote.compositions);
  const mergedScales = mergeScales(localScales, remote.scales);

  writeSavedCompositions(merged);
  writeScales(mergedScales);

  const payload: RemotePayload = {
    compositions: merged,
    scales: mergedScales,
  };

  if (!fileId) fileId = await createFile(payload);
  else await updateFile(fileId, payload);

  return {
    merged,
    mergedScales,
    fileId,
    pulledCount: remote.compositions.length,
    totalCount: merged.length,
  };
}
