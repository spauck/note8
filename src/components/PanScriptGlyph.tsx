/**
 * Simplified PanScript glyph: radial lines from center.
 * Position 0 = ding (center dot), 1..N = tone fields as short radial lines.
 */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: because */
/** biome-ignore-all lint/a11y/noSvgWithoutTitle: because */

import type { Settings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { handColor } from "./handColor";
import type { BaseNoteProps } from "./Notes";

export function getFieldAngle(index: number, total: number, offset: number): number {
  const side = index % 2 ? -1 : 1;
  const increment = Math.floor(index / 2);
  return Math.PI / 2 + (2 * Math.PI * (increment * side + offset)) / total;
}

interface RadialGlyphProps extends BaseNoteProps {
  size?: number;
  fluid?: boolean;
  className?: string;
}

/** Single-hand radial glyph */
export function RadialGlyph({
  settings,
  noteId,
  hand,
  size = 28,
  fluid,
  className,
}: RadialGlyphProps) {
  const cx = 50;
  const cy = 50;
  const innerR = 24;
  const outerR = 44;
  const note = Number.parseInt(noteId, 10);
  const color = handColor(hand);

  return (
    <svg
      viewBox="0 0 100 100"
      {...(fluid
        ? { width: "100%", height: "100%" }
        : { width: size, height: size })}
      className={cn("shrink-0", className)}
    >
      {/* Ding — small dot */}
      {note === 0 && (
        <circle cx={cx} cy={cy} r={7} fill={color || "currentColor"} />
      )}
      {/* Tone field lines */}
      {(() => {
        if (note === 0) return null;
        if (note > settings.panscriptFields) return <text>X</text>;

        const angle = getFieldAngle(
          note,
          settings.panscriptFields,
          settings.panscriptFieldOffset,
        );
        const x1 = cx + innerR * Math.cos(angle);
        const y1 = cy + innerR * Math.sin(angle);
        const x2 = cx + outerR * Math.cos(angle);
        const y2 = cy + outerR * Math.sin(angle);
        return (
          <line
            key={noteId}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color || "currentColor"}
            strokeWidth={10}
            strokeLinecap="round"
          />
        );
      })()}
    </svg>
  );
}

interface CompositeEntry {
  position: number;
  color: string;
}

interface CompositeGlyphProps {
  settings: Settings;
  entries: CompositeEntry[];
  size?: number;
  fluid?: boolean;
  className?: string;
}

/** Multi-hand composite glyph: each position can have its own color */
export function CompositeGlyph({
  settings,
  entries,
  size = 28,
  fluid,
  className,
}: CompositeGlyphProps) {
  const cx = 50,
    cy = 50;
  const innerR = 24;
  const outerR = 44;

  return (
    <svg
      viewBox="0 0 100 100"
      {...(fluid
        ? { width: "100%", height: "100%" }
        : { width: size, height: size })}
      className={cn("shrink-0", className)}
    >
      {entries.map((entry, i) => {
        if (entry.position === 0) {
          return <circle key={i} cx={cx} cy={cy} r={5} fill={entry.color} />;
        }
        if (entry.position > settings.panscriptFields) return null;
        const angle = getFieldAngle(
          entry.position,
          settings.panscriptFields,
          settings.panscriptFieldOffset,
        );
        const x1 = cx + innerR * Math.cos(angle);
        const y1 = cy + innerR * Math.sin(angle);
        const x2 = cx + outerR * Math.cos(angle);
        const y2 = cy + outerR * Math.sin(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={entry.color}
            strokeWidth={7}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
