import { Dot } from "lucide-react";
import { useMemo, useState } from "react";
import { NoteGlyph } from "@/components/NoteGlyph";
import { decodeState, groupIntoRows } from "@/lib/composer-state";
import { useSettings } from "@/lib/settings";

interface Props {
  queryString: string;
  /** Max rows to show before requiring expansion. */
  collapsedRows?: number;
}

/** Compact, non-interactive preview of a composition. Renders up to
 *  `collapsedRows` rows and offers an expand toggle for the rest. */
export function CompositionPreview({ queryString, collapsedRows = 2 }: Props) {
  const { settings: baseSettings } = useSettings();
  const [expanded, setExpanded] = useState(false);

  const state = useMemo(() => decodeState(queryString), [queryString]);
  const rows = useMemo(() => groupIntoRows(state.bars), [state.bars]);

  // Use composition's scale for coloring/glyphs when it specifies one.
  const settings = useMemo(() => {
    if (state.ding && state.scaleNotes) {
      return {
        ...baseSettings,
        scaleDing: state.ding,
        scaleNotes: state.scaleNotes,
      };
    }
    return baseSettings;
  }, [baseSettings, state.ding, state.scaleNotes]);

  const maxRowBeats = Math.max(
    ...rows.map((r) => r.bars.reduce((s, b) => s + b.beats.length, 0)),
    1,
  );

  const visibleRows = expanded ? rows : rows.slice(0, collapsedRows);
  const hiddenCount = rows.length - visibleRows.length;

  return (
    <div className="space-y-1">
      {visibleRows.map((row, rIdx) => {
        const rowBeats = row.bars.reduce((s, b) => s + b.beats.length, 0);
        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: stable in preview
            key={rIdx}
            className="grid gap-0"
            style={{
              gridTemplateColumns: `repeat(${maxRowBeats}, minmax(0, 1fr))`,
            }}
          >
            {row.bars.map((bar, bIdx) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: stable
                key={bIdx}
                className={`grid ${bIdx > 0 ? "border-l border-bar-divider" : ""}`}
                style={{
                  gridTemplateColumns: `repeat(${bar.beats.length}, 1fr)`,
                  gridColumn: `span ${bar.beats.length}`,
                }}
              >
                {bar.beats.map((beat, beatIdx) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: stable
                    key={beatIdx}
                    className="aspect-[7/9] relative flex items-center justify-center text-beat-empty"
                  >
                    {beat.length === 0 ? (
                      <Dot className="w-3 h-3 opacity-40" />
                    ) : (
                      <NoteGlyph notes={beat} settings={settings} />
                    )}
                  </div>
                ))}
              </div>
            ))}
            {rowBeats < maxRowBeats && (
              <div style={{ gridColumn: `span ${maxRowBeats - rowBeats}` }} />
            )}
          </div>
        );
      })}
      {rows.length > collapsedRows && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((x) => !x);
          }}
          className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          {expanded
            ? "Show less"
            : `Show ${hiddenCount} more row${hiddenCount === 1 ? "" : "s"}`}
        </button>
      )}
    </div>
  );
}
