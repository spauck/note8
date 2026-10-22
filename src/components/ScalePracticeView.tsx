import { useMemo, useState } from "react";
import { resolvePracticeScale } from "@/lib/practice-scale";
import type { SavedScale } from "@/lib/scale-library";
import { PracticeSession } from "./practice/PracticeSession";
import { RootNotePicker } from "./RootNotePicker";
import { ScalePicker } from "./ScalePicker";

interface ScalePracticeViewProps {
  ding: string;
  scaleNotes: string;
  scales: SavedScale[];
}

export function ScalePracticeView({ ding, scaleNotes, scales }: ScalePracticeViewProps) {
  const [selection, setSelection] = useState<SavedScale | null>(null);
  const [root, setRoot] = useState<string | null>(null);
  const current = selection ?? scales.find((s) => s.ding === ding && s.notes === scaleNotes) ?? { id: "composition", name: "Composition scale", ding, notes: scaleNotes, savedAt: 0 };
  const options = scales.some((s) => s.id === current.id) ? scales : [current, ...scales];
  const original = useMemo(() => resolvePracticeScale(current.ding, current.notes), [current.ding, current.notes]);
  const exactRoot = root ?? original[0]?.label ?? "D3";
  const notes = useMemo(() => {
    const newRoot = resolvePracticeScale(exactRoot, "")[0];
    const oldRoot = original[0];
    if (!newRoot || !oldRoot) return [];
    const shift = newRoot.semitone - oldRoot.semitone;
    // Re-resolve the original octave-aware scale relative to the selected root.
    return original.map((note) => {
      const semitone = note.semitone + shift;
      const pitchNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
      return { ...note, semitone, frequency: note.frequency * 2 ** (shift / 12), label: shift === 0 ? note.label : `${pitchNames[((semitone % 12) + 12) % 12]}${Math.floor(semitone / 12)}` };
    });
  }, [original, exactRoot]);

  return (
    <section className="mx-auto max-w-3xl pt-4 pb-8 space-y-7" aria-label="Scale practice">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Scale practice</h1>
        <div className="flex flex-wrap justify-center items-center gap-4">
          <ScalePicker scales={options} activeId={current.id} onPick={(scale) => { setSelection(scale); setRoot(null); }} />
          <RootNotePicker value={exactRoot} onChange={setRoot} />
        </div>
      </div>
      <PracticeSession key={`${current.id}:${current.ding}:${current.notes}:${exactRoot}`} notes={notes} />
    </section>
  );
}