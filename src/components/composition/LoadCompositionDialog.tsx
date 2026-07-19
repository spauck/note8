import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SavedComposition } from "@/lib/composition-storage";
import { CompositionPreview } from "./CompositionPreview";

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
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
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
          <div className="overflow-y-auto space-y-2 pr-1">
            {compositions.map((comp) => (
              <div
                key={comp.id ?? `name:${comp.name}`}
                className="rounded border border-border hover:border-accent-foreground/30 transition-colors group"
              >
                <div className="flex items-center justify-between px-3 pt-2">
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
                    className="opacity-60 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-1"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div
                  onClick={() => onLoad(comp)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onLoad(comp);
                  }}
                  role="button"
                  tabIndex={0}
                  className="block w-full text-left px-3 pb-2 pt-1 cursor-pointer"
                >
                  <CompositionPreview queryString={comp.queryString} />
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
