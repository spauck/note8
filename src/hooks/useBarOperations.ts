import { useCallback } from "react";
import {
  type Bar,
  type ComposerState,
  createEmptyBar,
  nextBarLength,
  resizeBar,
} from "@/lib/composer-state";

interface SelectedCell {
  barIdx: number;
  beatIdx: number;
}

/** Bar-level operations: add, delete, resize, set break. */
export function useBarOperations(
  state: ComposerState,
  updateState: (s: ComposerState) => void,
  selectedCell: SelectedCell | null,
  setSelectedCell: (c: SelectedCell | null) => void,
) {
  const addBar = useCallback(
    (position: number, currentBar: Bar, where: "before" | "after") => {
      const length = nextBarLength(state.bars);
      const newBar = createEmptyBar(
        length,
        where === "before" && currentBar.breakBefore,
      );
      const replacementBar = {
        ...currentBar,
        breakBefore: where === "after" && currentBar.breakBefore,
      };
      updateState({
        ...state,
        bars: [
          ...state.bars.slice(0, position),
          where === "before" ? newBar : replacementBar,
          where === "after" ? newBar : replacementBar,
          ...state.bars.slice(position + 1),
        ],
      });
    },
    [state, updateState],
  );

  const deleteBar = useCallback(
    (idx: number) => {
      if (state.bars.length <= 1) return;
      const breakBefore = state.bars[idx].breakBefore;
      const newBars = state.bars
        .filter((_, i) => i !== idx)
        .map(
          (bar, i): Bar =>
            i === 0 || (i === idx && breakBefore)
              ? { ...bar, breakBefore: true }
              : bar,
        );
      updateState({ ...state, bars: newBars });
      if (selectedCell?.barIdx === idx) setSelectedCell(null);
      else if (selectedCell && selectedCell.barIdx > idx)
        setSelectedCell({
          ...selectedCell,
          barIdx: selectedCell.barIdx - 1,
        });
    },
    [state, updateState, selectedCell, setSelectedCell],
  );

  const changeBarLength = useCallback(
    (idx: number, delta: number) => {
      const bar = state.bars[idx];
      if (!bar) return;
      const newLen = bar.beats.length + delta;
      if (newLen < 1 || newLen > 32) return;
      const newBars = state.bars.map((b, i) =>
        i === idx ? resizeBar(b, newLen) : b,
      );
      updateState({ ...state, bars: newBars });
      if (selectedCell?.barIdx === idx && selectedCell.beatIdx >= newLen) {
        setSelectedCell({ barIdx: idx, beatIdx: newLen - 1 });
      }
    },
    [state, updateState, selectedCell, setSelectedCell],
  );

  const setBreak = useCallback(
    (idx: number, breakBefore: boolean) => {
      if (idx === 0) return;
      const newBars = state.bars.map((b, i) =>
        i === idx ? { ...b, breakBefore } : b,
      );
      updateState({ ...state, bars: newBars });
    },
    [state, updateState],
  );

  return { addBar, deleteBar, changeBarLength, setBreak };
}
