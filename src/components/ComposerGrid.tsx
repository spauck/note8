import { useEffect, useRef, useState } from "react";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import type { Bar } from "@/lib/composer-state";
import { groupIntoRows } from "@/lib/composer-state";
import { GridRow } from "./GridRow";

interface SelectedCell {
  barIdx: number;
  beatIdx: number;
}

interface ComposerGridProps {
  bars: Bar[];
  notesPerCount: number;
  viewMode?: boolean;
  selectedCell: SelectedCell | null;
  onSelectCell: (cell: SelectedCell | null) => void;
  onDeleteBar: (barIdx: number) => void;
  onChangeBarLength: (barIdx: number, delta: number) => void;
  onSetBreak: (barIdx: number, breakBefore: boolean) => void;
  onAddBar: (
    position: number,
    currentBar: Bar,
    where: "before" | "after",
  ) => void;
  onMoveRow: (rowIdx: number, direction: -1 | 1) => void;
  onDuplicateRow: (rowIdx: number) => void;
  onDeleteRow: (rowIdx: number) => void;
}

export function ComposerGrid({
  bars,
  notesPerCount,
  viewMode,
  selectedCell,
  onSelectCell,
  onDeleteBar,
  onChangeBarLength,
  onSetBreak,
  onAddBar,
  onMoveRow,
  onDuplicateRow,
  onDeleteRow,
}: ComposerGridProps) {
  // Only one bar's controls can be open at a time across the whole grid.
  const [openBarIdx, setOpenBarIdx] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useOutsideClick(gridRef, openBarIdx !== null, () => setOpenBarIdx(null));

  // Close controls if the open bar gets removed.
  useEffect(() => {
    if (openBarIdx !== null && openBarIdx >= bars.length) {
      setOpenBarIdx(null);
    }
  }, [bars.length, openBarIdx]);

  const handleSelect = (barIdx: number, beatIdx: number) => {
    if (viewMode) return;
    if (selectedCell?.barIdx === barIdx && selectedCell?.beatIdx === beatIdx) {
      onSelectCell(null);
    } else {
      onSelectCell({ barIdx, beatIdx });
    }
  };

  const rows = groupIntoRows(bars);

  // Uniform scale: every row uses a column template sized to the longest row.
  const maxRowBeats = Math.max(
    ...rows.map((r) => r.bars.reduce((s, b) => s + b.beats.length, 0)),
    1,
  );

  return (
    <div className="space-y-3" ref={gridRef}>
      {rows.map((row, rowIdx) => (
        <GridRow
          // biome-ignore lint/suspicious/noArrayIndexKey: perfectly fine here
          key={rowIdx}
          rowIdx={rowIdx}
          rowCount={rows.length}
          rowStart={row.start}
          rowBars={row.bars}
          notesPerCount={notesPerCount}
          viewMode={viewMode}
          maxRowBeats={maxRowBeats}
          totalBars={bars.length}
          openBarIdx={openBarIdx}
          setOpenBarIdx={setOpenBarIdx}
          selectedCell={selectedCell}
          onSelectBeat={handleSelect}
          onDeleteBar={onDeleteBar}
          onChangeBarLength={onChangeBarLength}
          onSetBreak={onSetBreak}
          onAddBar={onAddBar}
          onMoveRow={onMoveRow}
          onDuplicateRow={onDuplicateRow}
          onDeleteRow={onDeleteRow}
        />
      ))}
    </div>
  );
}
