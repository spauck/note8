import { Cloud, HardDrive, Moon, Plus, Settings, Sun, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  getDriveClientId,
  isDriveSignedIn,
  setDriveClientId,
  setDriveFileId,
  signInDrive,
  signOutDrive,
  syncWithDrive,
} from "@/lib/drive-storage";
import {
  getGistId,
  getGistToken,
  setGistId,
  setGistToken,
  syncWithGist,
} from "@/lib/gist-storage";
import {
  deleteScale,
  generateScaleId,
  listScales,
  type SavedScale,
  upsertScale,
} from "@/lib/scale-library";
import { useSettings } from "@/lib/settings";
import { applyTheme, loadTheme, type Theme } from "@/lib/theme";

const COLOR_PRESETS = [
  { label: "Red", hsl: "0 70% 58%" },
  { label: "Green", hsl: "140 60% 45%" },
  { label: "Blue", hsl: "210 80% 60%" },
  { label: "Neutral", hsl: "var(--foreground)" },
] as const;

const HAND_CONFIGS = [
  { key: "rightHandColor" as const, label: "Right Hand" },
  { key: "leftHandColor" as const, label: "Left Hand" },
  { key: "anyHandColor" as const, label: "Any Hand" },
];

export function SettingsPanel() {
  const { settings, updateSettings } = useSettings();
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [token, setTokenState] = useState<string>(getGistToken);
  const [gistId, setGistIdState] = useState<string>(getGistId);
  const [syncing, setSyncing] = useState(false);
  const [scales, setScales] = useState<SavedScale[]>(listScales);
  const [driveClientId, setDriveClientIdState] =
    useState<string>(getDriveClientId);
  const [driveConnected, setDriveConnected] =
    useState<boolean>(isDriveSignedIn);
  const [driveSyncing, setDriveSyncing] = useState(false);

  const refreshScales = () => setScales(listScales());

  useEffect(() => {
    // Refresh when sheet opens / settings change so external edits show up.
    refreshScales();
  }, []);

  const saveToken = () => {
    setGistToken(token.trim());
    toast.success(token.trim() ? "Token saved" : "Token cleared");
  };

  const runSync = async () => {
    if (!getGistToken()) {
      toast.error("Add a GitHub token first");
      return;
    }
    setSyncing(true);
    try {
      const res = await syncWithGist();
      setGistIdState(res.gistId);
      refreshScales();
      toast.success(
        `Synced ${res.totalCount} composition${res.totalCount !== 1 ? "s" : ""}`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const clearGistId = () => {
    setGistId("");
    setGistIdState("");
    toast.success("Gist link cleared");
  };

  const saveDriveClientId = () => {
    setDriveClientId(driveClientId.trim());
    toast.success(
      driveClientId.trim() ? "Client ID saved" : "Client ID cleared",
    );
  };

  const connectDrive = async () => {
    if (!getDriveClientId()) {
      toast.error("Add a Google OAuth Client ID first");
      return;
    }
    try {
      await signInDrive();
      setDriveConnected(true);
      toast.success("Connected to Google Drive");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign-in failed");
    }
  };

  const disconnectDrive = () => {
    signOutDrive();
    setDriveFileId("");
    setDriveConnected(false);
    toast.success("Disconnected from Drive");
  };

  const runDriveSync = async () => {
    if (!isDriveSignedIn()) {
      await connectDrive();
      if (!isDriveSignedIn()) return;
    }
    setDriveSyncing(true);
    try {
      const res = await syncWithDrive();
      refreshScales();
      toast.success(
        `Synced ${res.totalCount} composition${res.totalCount !== 1 ? "s" : ""}`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setDriveSyncing(false);
    }
  };

  const isDark = theme === "dark";

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  const setColor = (
    hand: "rightHandColor" | "leftHandColor" | "anyHandColor",
    hsl: string,
  ) => {
    updateSettings({ ...settings, [hand]: hsl });
  };

  const updateScaleField = (
    id: string,
    patch: Partial<Pick<SavedScale, "name" | "ding" | "notes">>,
  ) => {
    const existing = scales.find((s) => s.id === id);
    if (!existing) return;
    upsertScale({ ...existing, ...patch });
    refreshScales();
  };

  const addScale = () => {
    const entry = upsertScale({
      id: generateScaleId(),
      name: `Scale ${scales.length + 1}`,
      ding: "D3",
      notes: "A3 A#3 C4 D4 E4 F4 G4 A4",
    });
    refreshScales();
    if (!settings.activeScaleId) {
      updateSettings({ ...settings, activeScaleId: entry.id });
    }
  };

  const removeScale = (id: string) => {
    deleteScale(id);
    refreshScales();
    if (settings.activeScaleId === id) {
      const remaining = listScales();
      updateSettings({
        ...settings,
        activeScaleId: remaining[0]?.id ?? null,
      });
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Theme */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Theme
            </h3>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-2 rounded border border-border text-sm text-foreground hover:border-ring/50 transition-colors"
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
              {isDark ? "Switch to Light" : "Switch to Dark"}
            </button>
          </section>

          {/* Colors */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Hand Colors
            </h3>
            <div className="space-y-3">
              {HAND_CONFIGS.map(({ key, label }) => (
                <div key={key} className="space-x-1.5 flex items-center">
                  <span className="text-sm text-muted-foreground w-20">
                    {label}
                  </span>
                  <div className="flex gap-1.5">
                    {COLOR_PRESETS.map((preset) => {
                      const isActive = settings[key] === preset.hsl;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setColor(key, preset.hsl)}
                          className={`flex items-center gap-1.5 px-0.5 py-0.5 rounded-full text-xs border-2 transition-colors ${
                            isActive
                              ? "border-ring bg-accent text-foreground font-semibold"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-ring/50"
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: `hsl(${preset.hsl})` }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tone Fields */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Tone Fields
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              Number of tone fields on your handpan (excluding ding)
            </p>
            <div className="flex flex-row gap-4">
              <select
                value={settings.panscriptFields}
                onChange={(e) =>
                  updateSettings({
                    ...settings,
                    panscriptFields: parseInt(e.target.value, 10),
                  })
                }
                className="bg-secondary text-foreground rounded px-2 py-1 text-sm font-mono border border-border"
              >
                {[7, 8, 9, 10, 11, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} ({n}+1)
                  </option>
                ))}
              </select>
              <select
                value={settings.panscriptFieldOffset}
                onChange={(e) =>
                  updateSettings({
                    ...settings,
                    panscriptFieldOffset: parseFloat(e.target.value),
                  })
                }
                className="bg-secondary text-foreground rounded px-2 py-1 text-sm font-mono border border-border"
              >
                <option key="centre" value={0}>
                  Centre
                </option>
                <option key="offset" value={-0.5}>
                  Offset
                </option>
              </select>
            </div>
          </section>

          {/* Scale Library */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                Scale Library
              </h3>
              <button
                type="button"
                onClick={addScale}
                className="text-xs px-2 py-1 rounded border border-border hover:border-ring/50 text-foreground flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Notes are letters A–G with optional # or b and an octave 0–9,
              e.g. <code>D3</code>. Assign scales to compositions via the
              picker next to the title.
            </p>
            <div className="space-y-3">
              {scales.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  No scales yet. Tap "Add" to create one.
                </p>
              )}
              {scales.map((s) => (
                <div
                  key={s.id}
                  className="border border-border rounded p-2 space-y-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={s.name}
                      onChange={(e) =>
                        updateScaleField(s.id, { name: e.target.value })
                      }
                      placeholder="Scale name"
                      className="text-xs h-7 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeScale(s.id)}
                      className="text-muted-foreground hover:text-destructive p-1"
                      title="Delete scale"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      value={s.ding}
                      onChange={(e) =>
                        updateScaleField(s.id, { ding: e.target.value })
                      }
                      placeholder="D3"
                      className="text-xs h-7 font-mono w-16"
                    />
                    <span className="text-muted-foreground">/</span>
                    <Input
                      value={s.notes}
                      onChange={(e) =>
                        updateScaleField(s.id, { notes: e.target.value })
                      }
                      placeholder="A3 A#3 C4 D4 E4 F4 G4 A4"
                      className="text-xs h-7 font-mono flex-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* GitHub Gist Sync */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              GitHub Gist Sync
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              Paste a{" "}
              <a
                href="https://github.com/settings/tokens/new?scopes=gist&description=Handpan%20Composer"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-foreground"
              >
                personal access token
              </a>{" "}
              with the <code className="font-mono">gist</code> scope.
              Compositions and scales merge with local storage by newest
              timestamp.
            </p>
            <div className="flex gap-2 mb-2">
              <Input
                type="password"
                value={token}
                onChange={(e) => setTokenState(e.target.value)}
                placeholder="ghp_..."
                className="text-xs font-mono"
              />
              <button
                type="button"
                onClick={saveToken}
                className="text-xs px-3 py-1 rounded border border-border hover:border-ring/50 text-foreground"
              >
                Save
              </button>
            </div>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={runSync}
                disabled={syncing || !token.trim()}
                className="text-xs px-3 py-1 rounded border border-border hover:border-ring/50 text-foreground disabled:opacity-50"
              >
                {syncing ? "Syncing..." : "Sync now"}
              </button>
              {gistId && (
                <>
                  <a
                    href={`https://gist.github.com/${gistId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground underline truncate"
                  >
                    {gistId.slice(0, 10)}...
                  </a>
                  <button
                    type="button"
                    onClick={clearGistId}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Unlink
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
