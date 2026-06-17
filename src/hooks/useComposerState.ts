import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  type ComposerState,
  decodeState,
  encodeState,
} from "@/lib/composer-state";

/** Reads/writes the composer state through the URL query string. */
export function useComposerState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo(
    () => decodeState(searchParams.toString()),
    [searchParams],
  );

  const updateState = useCallback(
    (newState: ComposerState) => {
      const next = new URLSearchParams(encodeState(newState));
      // Preserve non-state params like `name` and `id` that live alongside
      // the encoded composition state in the URL.
      searchParams.forEach((value, key) => {
        if (
          !next.has(key) &&
          key !== "n" &&
          key !== "bars" &&
          key !== "ding" &&
          key !== "scale" &&
          key !== "b" &&
          key !== "r" &&
          key !== "d"
        ) {
          next.set(key, value);
        }
      });
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  return { state, updateState, searchParams, setSearchParams };
}
