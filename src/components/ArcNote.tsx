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
  // Left paren: arc opening to the right; right paren: arc opening to the left.
  const d =
    side === "left"
      ? "M 65 15 Q 30 50 65 85"
      : "M 35 15 Q 70 50 35 85";
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
        strokeWidth={12}
        strokeLinecap="round"
      />
    </svg>
  );
}
