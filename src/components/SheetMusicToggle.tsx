import { FileMusic } from "lucide-react";

interface SheetMusicToggleProps {
  active: boolean;
  onToggle: () => void;
}

/** Switches between the composer grid and the sheet-music view. */
export function SheetMusicToggle({ active, onToggle }: SheetMusicToggleProps) {
  return (
    <button
      type="button"
      className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors border ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "text-muted-foreground hover:text-foreground border-border hover:border-primary/50"
      }`}
      title={active ? "Back to composer" : "Show as sheet music"}
      onClick={onToggle}
    >
      <FileMusic className="w-3.5 h-3.5" />
      Sheet
    </button>
  );
}
