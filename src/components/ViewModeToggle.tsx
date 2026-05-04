import { Eye, Pencil } from "lucide-react";

interface ViewModeToggleProps {
  viewMode: boolean;
  onToggle: () => void;
}

/** Edit/View mode switch button. */
export function ViewModeToggle({ viewMode, onToggle }: ViewModeToggleProps) {
  return (
    <button
      type="button"
      className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors border ${
        viewMode
          ? "bg-primary text-primary-foreground border-primary"
          : "text-muted-foreground hover:text-foreground border-border hover:border-primary/50"
      }`}
      title={viewMode ? "Switch to edit mode" : "Switch to view mode"}
      onClick={onToggle}
    >
      {viewMode ? (
        <Pencil className="w-3.5 h-3.5" />
      ) : (
        <Eye className="w-3.5 h-3.5" />
      )}
      {viewMode ? "Edit" : "View"}
    </button>
  );
}
