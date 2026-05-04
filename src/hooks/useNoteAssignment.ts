import { useCallback, useMemo } from "react";
import type { Bar, Beat, ComposerState, Hand } from "@/lib/composer-state";

interface SelectedCell {
  barIdx: number;
  beatIdx: number;
}

/** Note-assignment operations bound to the currently selected cell. */
export function useNoteAssignment(
  state: ComposerState,
  updateState: (s: ComposerState) => void,
  selectedCell: SelectedCell | null,
  setSelectedCell: (c: SelectedCell | null) => void,
) {
  const activeNotes = useMemo<Array<{ value: string; hand: Hand }>>(() => {
    if (!selectedCell) return [];
    return state.bars[selectedCell.barIdx]?.beats[selectedCell.beatIdx] ?? [];
  }, [selectedCell, state]);

  const mapSelectedBeat = useCallback(
    (transform: (beat: Beat) => Beat): Bar[] => {
      if (!selectedCell) return state.bars;
      const { barIdx, beatIdx } = selectedCell;
      return state.bars.map((bar, bi): Bar => {
        if (bi !== barIdx) return bar;
        return {
          ...bar,
          beats: bar.beats.map(
            (beat, idx): Beat => (idx !== beatIdx ? beat : transform(beat)),
          ),
        };
      });
    },
    [selectedCell, state.bars],
  );

  const advanceSelection = useCallback(() => {
    if (!selectedCell) return;
    const { barIdx, beatIdx } = selectedCell;
    const bar = state.bars[barIdx];
    if (!bar) return;
    if (beatIdx + 1 < bar.beats.length) {
      setSelectedCell({ barIdx, beatIdx: beatIdx + 1 });
    } else if (barIdx + 1 < state.bars.length) {
      setSelectedCell({ barIdx: barIdx + 1, beatIdx: 0 });
    }
  }, [selectedCell, state.bars, setSelectedCell]);

  const assignNote = useCallback(
    (value: string, hand: Hand) => {
      if (!selectedCell) return;
      const wasEmpty = activeNotes.length === 0;
      const newBars = mapSelectedBeat((beat) => [
        ...beat.filter((n) => n.value !== value),
        { value, hand },
      ]);
      updateState({ ...state, bars: newBars });
      if (wasEmpty) advanceSelection();
    },
    [
      selectedCell,
      state,
      updateState,
      activeNotes,
      mapSelectedBeat,
      advanceSelection,
    ],
  );

  const removeNote = useCallback(
    (value: string) => {
      if (!selectedCell) return;
      const newBars = mapSelectedBeat((beat) =>
        beat.filter((n) => n.value !== value),
      );
      updateState({ ...state, bars: newBars });
    },
    [selectedCell, state, updateState, mapSelectedBeat],
  );

  const clearAll = useCallback(() => {
    if (!selectedCell) return;
    const newBars = mapSelectedBeat(() => []);
    updateState({ ...state, bars: newBars });
  }, [selectedCell, state, updateState, mapSelectedBeat]);

  const setBeat = useCallback(
    (beat: Beat) => {
      if (!selectedCell) return;
      const wasEmpty = activeNotes.length === 0;
      const newBars = mapSelectedBeat(() => beat);
      updateState({ ...state, bars: newBars });
      if (wasEmpty) advanceSelection();
    },
    [
      selectedCell,
      state,
      updateState,
      activeNotes,
      mapSelectedBeat,
      advanceSelection,
    ],
  );

  return { activeNotes, assignNote, removeNote, clearAll, setBeat };
}
