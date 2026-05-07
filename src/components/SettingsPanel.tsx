import { Cloud, Moon, Settings, Sun } from "lucide-react";
import { useState } from "react";
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
  getGistId,
  getGistToken,
  setGistId,
  setGistToken,
  syncWithGist,
} from "@/lib/gist-storage";
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

  const isDark = theme === "dark";

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  const getPresetHsl = (preset: (typeof COLOR_PRESETS)[number]) => preset.hsl;
  // theme is read just to re-render swatch active state when needed
  void isDark;

  const setColor = (
    hand: "rightHandColor" | "leftHandColor" | "anyHandColor",
    hsl: string,
  ) => {
    updateSettings({ ...settings, [hand]: hsl });
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
                      const hsl = getPresetHsl(preset);
                      const isActive = settings[key] === hsl;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setColor(key, hsl)}
                          className={`flex items-center gap-1.5 px-0.5 py-0.5 rounded-full text-xs border-2 transition-colors ${
                            isActive
                              ? "border-ring bg-accent text-foreground font-semibold"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-ring/50"
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: `hsl(${hsl})` }}
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
