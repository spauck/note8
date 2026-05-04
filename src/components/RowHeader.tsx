import { ChevronDown, ChevronUp, Copy, Merge, Trash2 } from "lucide-react";

interface RowHeaderProps {
  rowIdx: number;
  rowCount: number;
  canDelete: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onJoinPrevious: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const ICON_SIZE = 12;

/** Toolbar above each row: move/join/duplicate/delete actions. */
export function RowHeader({
  rowIdx,
  rowCount,
  canDelete,
  onMoveUp,
  onMoveDown,
  onJoinPrevious,
  onDuplicate,
  onDelete,
}: RowHeaderProps) {
  const baseBtn =
    "text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5";
  return (
    <div className="text-[10px] text-muted-foreground mb-1 sm:mb-2 font-mono flex items-center gap-2 flex-wrap">
      <span>Row {rowIdx + 1}</span>
      {rowIdx > 0 && (
        <button
          type="button"
          onClick={onMoveUp}
          className={baseBtn}
          title="Move row up"
        >
          <ChevronUp size={ICON_SIZE} />
        </button>
      )}
      {rowIdx < rowCount - 1 && (
        <button
          type="button"
          onClick={onMoveDown}
          className={baseBtn}
          title="Move row down"
        >
          <ChevronDown size={ICON_SIZE} />
        </button>
      )}
      {rowIdx > 0 && (
        <button
          type="button"
          onClick={onJoinPrevious}
          className={baseBtn}
          title="Join with previous row"
        >
          <Merge size={ICON_SIZE} />
        </button>
      )}
      <button
        type="button"
        onClick={onDuplicate}
        className={baseBtn}
        title="Duplicate row below"
      >
        <Copy size={ICON_SIZE} />
      </button>
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive inline-flex items-center gap-0.5"
          title="Delete row"
        >
          <Trash2 size={ICON_SIZE} />
        </button>
      )}
    </div>
  );
}
