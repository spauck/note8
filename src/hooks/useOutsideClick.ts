import { type RefObject, useEffect } from "react";

/** Calls `onOutside` when a mousedown lands outside the referenced element. */
export function useOutsideClick(
  ref: RefObject<HTMLElement>,
  active: boolean,
  onOutside: () => void,
) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOutside();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, active, onOutside]);
}
