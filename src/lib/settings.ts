import { createContext, useContext } from "react";
import type { Hand } from "./composer-state";

export interface Settings {
  rightHandColor: string;
  leftHandColor: string;
  anyHandColor: string;
  panscriptFields: number;
  panscriptFieldOffset: number;
  /** Ding note of the currently rendered scale. Derived from the loaded
   *  composition (when it specifies one) or from the active library scale. */
  scaleDing: string;
  /** Space-separated notes of the currently rendered scale. Derived as
   *  above. */
  scaleNotes: string;
  /** Default scale to use when a composition doesn't specify its own. */
  activeScaleId: string | null;
  /** Show detected chords above each bar with underlines under
   *  contributing beats. */
  detectBarChords: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  rightHandColor: "210 80% 60%",
  leftHandColor: "0 70% 58%",
  anyHandColor: "140 60% 45%",
  panscriptFields: 8,
  panscriptFieldOffset: 0,
  scaleDing: "D3",
  scaleNotes: "A3 A#3 C4 D4 E4 F4 G4 A4",
  activeScaleId: null,
  detectBarChords: false,
};

const STORAGE_KEY = "handpan-settings";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function applyColorVars(settings: Settings) {
  document.documentElement.style.setProperty(
    "--hand-right",
    settings.rightHandColor,
  );
  document.documentElement.style.setProperty(
    "--hand-left",
    settings.leftHandColor,
  );
  document.documentElement.style.setProperty(
    "--hand-any",
    settings.anyHandColor,
  );
}

export function handColorClass(hand: Hand): string {
  if (hand === "right") return "text-hand-right";
  if (hand === "left") return "text-hand-left";
  if (hand === "any") return "text-hand-any";
  return "text-hand-none";
}

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (s: Settings) => void;
}

export const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
});

export function useSettings() {
  return useContext(SettingsContext);
}

export { DEFAULT_SETTINGS };
