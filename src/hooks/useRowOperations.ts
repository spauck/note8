import { useCallback } from "react";
import type { Bar, ComposerState } from "@/lib/composer-state";

interface SelectedCell {
  barIdx: number;
  beatIdx: number;
}

/** Compute starting indices of each row in the flat bars array. */
function computeRowStarts(bars: Bar[]): number[] {
  const starts: number[] = [];
  bars.forEach((bar, i) => {
    if (i === 0 || bar.breakBefore) starts.push(i);
  });
  return starts;
}

/** Row-level operations: move, duplicate, delete. */
export function useRowOperations(
  state: ComposerState,
  updateState: (s: ComposerState) => void,
  selectedCell: SelectedCell | null,
  setSelectedCell: (c: SelectedCell | null) => void,
) {
  const moveRow = useCallback(
    (rowIdx: number, direction: -1 | 1) => {
      const rowStarts = computeRowStarts(state.bars);
      const targetIdx = rowIdx + direction;
      if (targetIdx < 0 || targetIdx >= rowStarts.length) return;

      const rowEnd = (idx: number) =>
        idx + 1 < rowStarts.length ? rowStarts[idx + 1] : state.bars.length;

      const aIdx = Math.min(rowIdx, targetIdx);
      const bIdx = Math.max(rowIdx, targetIdx);
      const aStart = rowStarts[aIdx];
      const aEnd = rowEnd(aIdx);
      const bStart = rowStarts[bIdx];
      const bEnd = rowEnd(bIdx);

      const before = state.bars.slice(0, aStart);
      const rowA = state.bars.slice(aStart, aEnd);
      const rowB = state.bars.slice(bStart, bEnd);
      const after = state.bars.slice(bEnd);

      const swapped = [...before, ...rowB, ...rowA, ...after].map(
        (bar, i): Bar => {
          if (
            i === 0 ||
            i === before.length ||
            i === before.length + rowB.length
          ) {
            return { ...bar, breakBefore: true };
          }
          return bar;
        },
      );
      updateState({ ...state, bars: swapped });
      setSelectedCell(null);
    },
    [state, updateState, setSelectedCell],
  );

  const duplicateRow = useCallback(
    (rowIdx: number) => {
      const rowStarts = computeRowStarts(state.bars);
      const start = rowStarts[rowIdx];
      const end =
        rowIdx + 1 < rowStarts.length
          ? rowStarts[rowIdx + 1]
          : state.bars.length;
      const rowBars = state.bars.slice(start, end);
      const cloned: Bar[] = rowBars.map((bar, i) => ({
        breakBefore: i === 0 ? true : bar.breakBefore,
        beats: bar.beats.map((beat) => beat.map((n) => ({ ...n }))),
      }));
      const newBars = [
        ...state.bars.slice(0, end),
        ...cloned,
        ...state.bars.slice(end),
      ];
      updateState({ ...state, bars: newBars });
    },
    [state, updateState],
  );

  const deleteRow = useCallback(
    (rowIdx: number) => {
      const rowStarts = computeRowStarts(state.bars);
      const start = rowStarts[rowIdx];
      const end =
        rowIdx + 1 < rowStarts.length
          ? rowStarts[rowIdx + 1]
          : state.bars.length;
      if (end - start >= state.bars.length) return;
      const newBars = state.bars
        .slice(0, start)
        .concat(state.bars.slice(end))
        .map((bar, i): Bar => (i === 0 ? { ...bar, breakBefore: true } : bar));
      updateState({ ...state, bars: newBars });
      if (selectedCell) {
        if (selectedCell.barIdx >= start && selectedCell.barIdx < end) {
          setSelectedCell(null);
        } else if (selectedCell.barIdx >= end) {
          setSelectedCell({
            ...selectedCell,
            barIdx: selectedCell.barIdx - (end - start),
          });
        }
      }
    },
    [state, updateState, selectedCell, setSelectedCell],
  );

  return { moveRow, duplicateRow, deleteRow };
}
