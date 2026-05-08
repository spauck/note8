import { useEffect, useRef } from "react";

export const AUTOSAVE_KEY = "handpan-composer-autosave";
const AUTOSAVE_INTERVAL = 3000;

/** Periodically persists the URL query string (incl. composition name) to localStorage. */
export function useAutosave(queryString: string) {
  const lastSavedRef = useRef("");
  useEffect(() => {
    const timer = setInterval(() => {
      if (queryString && queryString !== lastSavedRef.current) {
        localStorage.setItem(AUTOSAVE_KEY, queryString);
        lastSavedRef.current = queryString;
      }
    }, AUTOSAVE_INTERVAL);
    return () => clearInterval(timer);
  }, [queryString]);

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
