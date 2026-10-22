import { Button } from "@/components/ui/button";
import type { PracticeNote } from "@/lib/practice-scale";
import { cn } from "@/lib/utils";

interface PracticeHandpanProps {
  notes: PracticeNote[];
  guess: string | null;
  solved: boolean;
  disabled: boolean;
  onAnswer: (id: string) => void;
}

export function PracticeHandpan({ notes, guess, solved, disabled, onAnswer }: PracticeHandpanProps) {
  return (
    <div className="practice-pan relative mx-auto aspect-square w-full max-w-[480px] rounded-full border-2 border-border bg-secondary" role="group" aria-label="Handpan notes">
      <div aria-hidden="true" className="absolute inset-[9%] rounded-full border border-border" />
      {notes.map((note, index) => {
        const angle = Math.PI / 2 + ((index - 1) / Math.max(1, notes.length - 1)) * Math.PI * 2;
        const x = index === 0 ? 50 : 50 + Math.cos(angle) * 36;
        const y = index === 0 ? 50 : 50 + Math.sin(angle) * 36;
        const selected = guess === note.id;
        return (
          <Button
            key={note.id}
            variant="outline"
            aria-label={`${index === 0 ? "Ding" : `Note ${note.id}`}: ${note.label}`}
            disabled={disabled}
            onClick={() => onAnswer(note.id)}
            style={{ left: `${x}%`, top: `${y}%` }}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 h-auto aspect-square w-[15%] min-w-10 p-0 rounded-full flex-col gap-0 border-2 font-mono disabled:opacity-100",
              index === 0 && "w-[23%]",
              selected && (solved ? "border-hand-any bg-hand-any/15 text-hand-any" : "border-destructive bg-destructive/10 text-destructive"),
            )}
          >
            <span className="text-[10px] text-muted-foreground">{index === 0 ? "Ding" : note.id}</span>
            <span className="text-xs sm:text-base">{note.label}</span>
          </Button>
        );
      })}
    </div>
  );
}