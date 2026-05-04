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
      setSearchParams(encodeState(newState), { replace: true });
    },
    [setSearchParams],
  );

  return { state, updateState, searchParams, setSearchParams };
}
