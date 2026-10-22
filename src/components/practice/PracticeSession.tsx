import { ArrowRight, Play, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScalePractice } from "@/hooks/useScalePractice";
import type { PracticeNote } from "@/lib/practice-scale";
import { PracticeHandpan } from "./PracticeHandpan";

export function PracticeSession({ notes }: { notes: PracticeNote[] }) {
  const session = useScalePractice(notes);
  if (notes.length < 2) return <p className="text-sm text-destructive" role="alert">Choose a scale with a valid ding and at least one note.</p>;
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center space-y-3">
        <div className="min-h-7" role="status" aria-live="polite">
          <p className={session.solved ? "text-hand-any font-medium" : "text-muted-foreground"}>
            {session.solved ? `Correct · ${session.target?.label}` : session.guess ? "Not quite — try again" : session.target ? "Which note did you hear?" : "Ready to listen?"}
          </p>
        </div>
        <div className="flex justify-center gap-2">
          <Button onClick={() => void session.next()} disabled={session.busy}>
            {session.target ? <ArrowRight /> : <Play />}
            {session.target ? "Next note" : "Start practice"}
          </Button>
          <Button variant="outline" onClick={() => void session.replay()} disabled={!session.target || session.busy}>
            <Volume2 /> Replay
          </Button>
        </div>
        {session.error && <p role="alert" className="text-sm text-destructive">{session.error}</p>}
      </div>
      <PracticeHandpan notes={notes} guess={session.guess} solved={session.solved} disabled={!session.target || session.solved || session.busy} onAnswer={session.answer} />
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <RotateCcw className="h-3.5 w-3.5" />
        <span>{session.score.correct} / {session.score.total} correct first try</span>
      </div>
    </div>
  );
}