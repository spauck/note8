import type { KeyboardTab } from "./types";

interface KeyboardTabsProps {
  tab: KeyboardTab;
  onChange: (tab: KeyboardTab) => void;
  chordCount: number;
}

/** Tab selector for switching between Notes and Chords. */
export function KeyboardTabs({ tab, onChange, chordCount }: KeyboardTabsProps) {
  const options: { id: KeyboardTab; label: string }[] = [
    { id: "notes", label: "Notes" },
    ...(chordCount > 0
      ? [{ id: "chords" as KeyboardTab, label: `Chords (${chordCount})` }]
      : []),
  ];
  return (
    <>
      {options.map(({ id, label }) => (
        <button
          type="button"
          key={id}
          onClick={() => onChange(id)}
          className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
            tab === id
              ? "bg-accent border-ring text-foreground"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {label}
        </button>
      ))}
    </>
  );
}
