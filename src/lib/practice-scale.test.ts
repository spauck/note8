import { describe, expect, it } from "vitest";
import { choosePracticeNote, resolvePracticeScale } from "./practice-scale";

describe("practice scale octaves", () => {
  it("defaults an unspecified root to octave 3", () => {
    expect(resolvePracticeScale("D", "A")[0].label).toBe("D3");
  });
  it("places successive A notes in successively higher octaves", () => {
    expect(resolvePracticeScale("D3", "A A# C D E F G A A").map((n) => n.label)).toEqual([
      "D3", "A3", "A#3", "C4", "D4", "E4", "F4", "G4", "A4", "A5",
    ]);
  });
  it("respects the exact root octave", () => {
    expect(resolvePracticeScale("D2", "A C D").map((n) => n.label)).toEqual(["D2", "A2", "C3", "D3"]);
  });
  it("preserves explicit successive note octaves", () => {
    expect(resolvePracticeScale("D3", "A3 C5 A5").map((n) => n.label)).toEqual(["D3", "A3", "C5", "A5"]);
  });
  it("plays concert A4 at 440 Hz", () => {
    expect(resolvePracticeScale("D3", "A4")[1].frequency).toBe(440);
  });
  it("distinguishes repeated pitches as separate answers", () => {
    const notes = resolvePracticeScale("A3", "A A");
    expect(notes.map((n) => [n.id, n.label])).toEqual([["0", "A3"], ["1", "A4"], ["2", "A5"]]);
    expect(choosePracticeNote(notes.slice(0, 2), "0")?.id).toBe("1");
  });
});