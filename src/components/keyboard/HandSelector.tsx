import type { Hand } from "@/lib/composer-state";
import { handColorClass } from "@/lib/settings";

const HAND_OPTIONS: { hand: Hand; short: string }[] = [
  { hand: "right", short: "R" },
  { hand: "left", short: "L" },
  { hand: "any", short: "A" },
  { hand: "none", short: "N" },
];

interface HandSelectorProps {
  value: Hand;
  onChange: (hand: Hand) => void;
}

/** Compact R/L/A/N hand selector for the keyboard toolbar. */
export function HandSelector({ value, onChange }: HandSelectorProps) {
  return (
    <>
      {HAND_OPTIONS.map(({ hand, short }) => {
        const isActive = value === hand;
        const colorCls = handColorClass(hand);
        return (
          <button
            type="button"
            key={hand}
            onClick={() => onChange(hand)}
            className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors font-semibold ${
              isActive
                ? `${colorCls} border-ring bg-accent`
                : `${colorCls} border-border hover:border-ring/50`
            }`}
          >
            {short}
          </button>
        );
      })}
    </>
  );
}
