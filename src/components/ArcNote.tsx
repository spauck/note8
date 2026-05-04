/** biome-ignore-all lint/a11y/noSvgWithoutTitle: decorative */
import { cn } from "@/lib/utils";
import { handColor } from "./handColor";
import type { BaseNoteProps } from "./Notes";

interface ArcNoteProps extends BaseNoteProps {
  side: "left" | "right";
  size?: number | string;
  fluid?: boolean;
  className?: string;
}

/** A simple arc resembling a parenthesis — represents a tap on the
 * left or right side of the pan. */
export function ArcNote({
  hand,
  side,
  size = 28,
  fluid,
  className,
}: ArcNoteProps) {
  const color = handColor(hand) || "currentColor";
  // Draw a circular arc from +60° to -60° relative to horizontal (center 50,50; r=40).
  const d =
    side === "left"
      ? "M 30 15 A 40 40 0 0 0 30 85"
      : "M 70 15 A 40 40 0 0 1 70 85";
  return (
    <svg
      viewBox="0 0 100 100"
      {...(fluid
        ? { width: "100%", height: "100%" }
        : { width: size, height: size })}
      className={cn("shrink-0", className)}
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={9}
        strokeLinecap="round"
      />
    </svg>
  );
}
