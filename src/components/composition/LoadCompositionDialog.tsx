import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SavedComposition } from "@/lib/composition-storage";

interface LoadCompositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compositions: SavedComposition[];
  onLoad: (comp: SavedComposition) => void;
  onRequestDelete: (comp: SavedComposition) => void;
}

/** Dialog listing saved compositions for loading or deletion. */
export function LoadCompositionDialog({
  open,
  onOpenChange,
  compositions,
  onLoad,
  onRequestDelete,
}: LoadCompositionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Load Composition</DialogTitle>
          <DialogDescription>
            Select a saved composition to load.
          </DialogDescription>
        </DialogHeader>
        {compositions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No saved compositions yet.
          </p>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-1">
            {compositions.map((comp) => (
              <div
                key={comp.id ?? `name:${comp.name}`}
                className="flex items-center justify-between px-3 py-2 rounded hover:bg-accent/50 transition-colors group"
              >
                <button
                  type="button"
                  className="flex-1 text-left text-sm text-foreground"
                  onClick={() => onLoad(comp)}
                >
                  <span className="font-medium">{comp.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {new Date(comp.savedAt).toLocaleDateString()}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onRequestDelete(comp)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-1"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
