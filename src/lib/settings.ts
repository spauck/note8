import { createContext, useContext } from "react";
import type { Hand } from "./composer-state";

export interface Settings {
  rightHandColor: string;
  leftHandColor: string;
  anyHandColor: string;
  panscriptFields: number;
  panscriptFieldOffset: number;
  scaleDing: string;
  scaleNotes: string;
}

const DEFAULT_SETTINGS: Settings = {
  rightHandColor: "210 80% 60%",
  leftHandColor: "0 70% 58%",
  anyHandColor: "140 60% 45%",
  panscriptFields: 8,
  panscriptFieldOffset: 0,
  scaleDing: "D3",
  scaleNotes: "A3 A#3 C4 D4 E4 F4 G4 A4",
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
