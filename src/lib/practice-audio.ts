/** A soft struck-metal tone, synthesized locally without samples or a server. */
export class PracticeAudio {
  private context: AudioContext | null = null;
  private voices: OscillatorNode[] = [];

  async play(frequency: number) {
    this.context ??= new AudioContext();
    const context = this.context;
    await context.resume();
    for (const voice of this.voices) {
      try { voice.stop(); } catch { /* Already ended. */ }
    }
    this.voices = [];
    const start = context.currentTime;
    for (const [ratio, volume, decay] of [[1, 0.32, 1.7], [2, 0.08, 0.9], [3, 0.035, 0.5]]) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency * ratio;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + decay);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(start);
      oscillator.stop(start + decay + 0.05);
      this.voices.push(oscillator);
    }
  }

  dispose() {
    void this.context?.close();
    this.context = null;
    this.voices = [];
  }
}