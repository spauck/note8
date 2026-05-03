/** biome-ignore-all lint/suspicious/noArrayIndexKey: because */

import { ChevronDown, ChevronUp, Copy, Merge, Trash2 } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import type { Bar } from "@/lib/composer-state";
import { groupIntoRows } from "@/lib/composer-state";
import { BarColumn } from "./BarColumn";
import { BarControlStrip } from "./BarControlStrip";

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

  // Dismiss open controls when tapping anywhere outside the grid.
  useEffect(() => {
    if (openBarIdx === null) return;
    const handler = (e: MouseEvent) => {
      if (gridRef.current && !gridRef.current.contains(e.target as Node)) {
        setOpenBarIdx(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openBarIdx]);

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

  // Uniform scale across rows: every row uses the same column template,
  // sized to the row with the most beats. Shorter rows simply leave the
  // remaining columns empty.
  const maxRowBeats = Math.max(
    ...rows.map((r) => r.bars.reduce((s, b) => s + b.beats.length, 0)),
    1,
  );

  const _uniformGridTemplate = `repeat(${maxRowBeats}, minmax(0, 1fr))`;

  return (
    <div className="space-y-3" ref={gridRef}>
      {rows.map((row, rowIdx) => {
        const rowBars = row.bars.map((bar, i) => ({
          bar,
          barIdx: row.start + i,
        }));
        const totalBeats = rowBars.reduce(
          (s, { bar }) => s + bar.beats.length,
          0,
        );
        const _trailingEmpty = maxRowBeats - totalBeats;
        const _controlsTemplate = row.bars
          .map((b) => `minmax(0, ${b.beats.length}fr)`)
          .join(" ");

        // Compute starting absolute beat index for each bar so that count
        // labels flow continuously across bar boundaries within a row.
        let runningBeat = 0;
        const startBeats = rowBars.map(({ bar }) => {
          const start = runningBeat;
          runningBeat += bar.beats.length;
          return start;
        });

        const iconSize = 12;

        return (
          <div
            key={rowIdx}
            className="bg-card rounded-lg px-1 pt-1 pb-1 sm:px-2 border border-border relative"
          >
            {!viewMode && (
              <div className="text-[10px] text-muted-foreground mb-1 sm:mb-2 font-mono flex items-center gap-2 flex-wrap">
                <span>Row {rowIdx + 1}</span>
                {rowIdx > 0 && (
                  <button
                    type="button"
                    onClick={() => onMoveRow(rowIdx, -1)}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
                    title="Move row up"
                  >
                    <ChevronUp size={iconSize} />
                  </button>
                )}
                {rowIdx < rows.length - 1 && (
                  <button
                    type="button"
                    onClick={() => onMoveRow(rowIdx, 1)}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
                    title="Move row down"
                  >
                    <ChevronDown size={iconSize} />
                  </button>
                )}
                {rowIdx > 0 && (
                  <button
                    type="button"
                    onClick={() => onSetBreak(row.start, false)}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
                    title="Join with previous row"
                  >
                    <Merge size={iconSize} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDuplicateRow(rowIdx)}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
                  title="Duplicate row below"
                >
                  <Copy size={iconSize} />
                </button>
                {bars.length > row.bars.length && (
                  <button
                    type="button"
                    onClick={() => onDeleteRow(rowIdx)}
                    className="text-muted-foreground hover:text-destructive inline-flex items-center gap-0.5"
                    title="Delete row"
                  >
                    <Trash2 size={iconSize} />
                  </button>
                )}
              </div>
            )}

            <div
              className="grid w-full items-end"
              style={{ gridTemplateColumns: _uniformGridTemplate }}
            >
              {rowBars.map(({ bar, barIdx }, bi) => (
                <Fragment key={`bar-wrap-${barIdx}`}>
                  <BarColumn
                    bar={bar}
                    barIdx={barIdx}
                    startCount={startCounts[bi]}
                    notesPerCount={notesPerCount}
                    viewMode={viewMode}
                    isHighlighted={
                      openBarIdx === barIdx || selectedCell?.barIdx === barIdx
                    }
                    selectedBeatIdx={
                      selectedCell?.barIdx === barIdx
                        ? selectedCell.beatIdx
                        : null
                    }
                    onSelectBeat={(beatIdx) => handleSelect(barIdx, beatIdx)}
                    showDivider={bi < rowBars.length - 1 || !!_trailingEmpty}
                  />
                </Fragment>
              ))}

              {!!_trailingEmpty && (
                <div
                  style={{
                    gridTemplateColumns: `repeat(${_trailingEmpty}, minmax(0, 1fr))`,
                    gridColumn: `span ${_trailingEmpty}`,
                  }}
                />
              )}
            </div>

            <div className="flex flex-row items-start">
              {!viewMode &&
                rowBars.map(({ bar, barIdx }, bi) => (
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
                        canDelete={bars.length > 1}
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
          </div>
        );
      })}
    </div>
  );
}
