import { useEffect, useRef } from "react";
import { type ComposerState, encodeState } from "@/lib/composer-state";

export const AUTOSAVE_KEY = "handpan-composer-autosave";
const AUTOSAVE_INTERVAL = 3000;

/** Periodically persists the encoded composer state to localStorage. */
export function useAutosave(state: ComposerState) {
  const lastSavedRef = useRef("");
  useEffect(() => {
    const timer = setInterval(() => {
      const q = encodeState(state);
      if (q && q !== lastSavedRef.current) {
        localStorage.setItem(AUTOSAVE_KEY, q);
        lastSavedRef.current = q;
      }
    }, AUTOSAVE_INTERVAL);
    return () => clearInterval(timer);
  }, [state]);

  const clear = () => {
    localStorage.removeItem(AUTOSAVE_KEY);
    lastSavedRef.current = "";
  };
  return { clear };
}

/** Returns the autosaved query string (only used for the very first render). */
export function readAutosave(): string {
  try {
    return localStorage.getItem(AUTOSAVE_KEY) ?? "";
  } catch {
    return "";
  }
}
