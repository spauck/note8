import { useEffect, useRef, useState } from "react";
import { PracticeAudio } from "@/lib/practice-audio";
import { choosePracticeNote, type PracticeNote } from "@/lib/practice-scale";

export function useScalePractice(notes: PracticeNote[]) {
  const audio = useRef<PracticeAudio | null>(null);
  const [target, setTarget] = useState<PracticeNote | null>(null);
  const [guess, setGuess] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const attempted = useRef(false);

  useEffect(() => () => { audio.current?.dispose(); }, []);

  const play = async (note: PracticeNote) => {
    setBusy(true);
    setError(null);
    try {
      audio.current ??= new PracticeAudio();
      await audio.current.play(note.frequency);
      return true;
    } catch {
      setError("Sound could not play. Check your device audio and try again.");
      return false;
    } finally { setBusy(false); }
  };

  const next = async () => {
    const note = choosePracticeNote(notes, target?.id);
    if (!note || !await play(note)) return;
    setTarget(note);
    setGuess(null);
    setSolved(false);
    attempted.current = false;
  };

  const answer = (id: string) => {
    if (!target || solved || busy) return;
    const correct = id === target.id;
    if (!attempted.current) {
      setScore((s) => ({ correct: s.correct + Number(correct), total: s.total + 1 }));
      attempted.current = true;
    }
    setGuess(id);
    setSolved(correct);
  };

  return { target, guess, solved, score, error, busy, next, answer, replay: () => target && play(target) };
}