/** biome-ignore-all lint/suspicious/noArrayIndexKey: because */

import { Fragment } from "react";
import type { Bar } from "@/lib/composer-state";
import { BarColumn } from "./BarColumn";
import { BarControlStrip } from "./BarControlStrip";
import { RowHeader } from "./RowHeader";

interface SelectedCell {
  barIdx: number;
  beatIdx: number;
}

interface GridRowProps {
  rowIdx: number;
  rowCount: number;
  rowStart: number;
  rowBars: Bar[];
  notesPerCount: number;
  viewMode?: boolean;
  maxRowBeats: number;
  totalBars: number;
  openBarIdx: number | null;
  setOpenBarIdx: (idx: number | null) => void;
  selectedCell: SelectedCell | null;
  onSelectBeat: (barIdx: number, beatIdx: number) => void;
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

/** A single row of bars: header toolbar, beat grid, and per-bar control strip. */
export function GridRow({
  rowIdx,
  rowCount,
  rowStart,
  rowBars,
  notesPerCount,
  viewMode,
  maxRowBeats,
  totalBars,
  openBarIdx,
  setOpenBarIdx,
  selectedCell,
  onSelectBeat,
  onDeleteBar,
  onChangeBarLength,
  onSetBreak,
  onAddBar,
  onMoveRow,
  onDuplicateRow,
  onDeleteRow,
}: GridRowProps) {
  const indexedBars = rowBars.map((bar, i) => ({
    bar,
    barIdx: rowStart + i,
  }));
  const totalBeats = indexedBars.reduce(
    (s, { bar }) => s + bar.beats.length,
    0,
  );
  const trailingEmpty = maxRowBeats - totalBeats;
  const uniformGridTemplate = `repeat(${maxRowBeats}, minmax(0, 1fr))`;

  // Starting absolute beat index per bar so count labels flow continuously.
  let runningBeat = 0;
  const startBeats = indexedBars.map(({ bar }) => {
    const start = runningBeat;
    runningBeat += bar.beats.length;
    return start;
  });

  return (
    <div className="bg-card rounded-lg px-1 pt-1 pb-1 sm:px-2 border border-border relative">
      {!viewMode && (
        <RowHeader
          rowIdx={rowIdx}
          rowCount={rowCount}
          canDelete={totalBars > rowBars.length}
          onMoveUp={() => onMoveRow(rowIdx, -1)}
          onMoveDown={() => onMoveRow(rowIdx, 1)}
          onJoinPrevious={() => onSetBreak(rowStart, false)}
          onDuplicate={() => onDuplicateRow(rowIdx)}
          onDelete={() => onDeleteRow(rowIdx)}
        />
      )}

      <div
        className="grid w-full items-end"
        style={{ gridTemplateColumns: uniformGridTemplate }}
      >
        {indexedBars.map(({ bar, barIdx }, bi) => (
          <Fragment key={`bar-wrap-${barIdx}`}>
            <BarColumn
              bar={bar}
              barIdx={barIdx}
              startBeat={startBeats[bi]}
              notesPerCount={notesPerCount}
              viewMode={viewMode}
              isHighlighted={
                openBarIdx === barIdx || selectedCell?.barIdx === barIdx
              }
              selectedBeatIdx={
                selectedCell?.barIdx === barIdx ? selectedCell.beatIdx : null
              }
              onSelectBeat={(beatIdx) => onSelectBeat(barIdx, beatIdx)}
              showDivider={bi < indexedBars.length - 1 || !!trailingEmpty}
            />
          </Fragment>
        ))}

        {!!trailingEmpty && (
          <div
            style={{
              gridTemplateColumns: `repeat(${trailingEmpty}, minmax(0, 1fr))`,
              gridColumn: `span ${trailingEmpty}`,
            }}
          />
        )}
      </div>

      {!viewMode && (
        <div className="flex flex-row items-start">
          {indexedBars.map(({ bar, barIdx }, bi) => (
            <Fragment key={`strip-wrap-${barIdx}`}>
              <div
                style={{
                  width:
                    openBarIdx === barIdx
                      ? undefined
                      : `${(bar.beats.length / maxRowBeats) * 100}%`,
                  minWidth:
                    openBarIdx === barIdx
                      ? `${(bar.beats.length / maxRowBeats) * 100}%`
                      : undefined,
                }}
                className={openBarIdx === barIdx ? "shrink-0" : undefined}
              >
                <BarControlStrip
                  isOpen={openBarIdx === barIdx}
                  isFirstInRow={bi === 0}
                  isFirstBarOverall={barIdx === 0}
                  canDelete={totalBars > 1}
                  canShorten={bar.beats.length > 2}
                  onToggle={() =>
                    setOpenBarIdx(openBarIdx === barIdx ? null : barIdx)
                  }
                  onAddBefore={() => onAddBar(barIdx, bar, "before")}
                  onAddAfter={() => onAddBar(barIdx, bar, "after")}
                  onShorten={() => onChangeBarLength(barIdx, -1)}
                  onLengthen={() => onChangeBarLength(barIdx, +1)}
                  onSetBreak={() => onSetBreak(barIdx, true)}
                  onDelete={() => onDeleteBar(barIdx)}
                />
              </div>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
