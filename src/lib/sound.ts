// Cute synthesized sound effects via the Web Audio API.
// The AudioContext is created lazily on the first user gesture (browser autoplay rules).

type Wave = OscillatorType;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  enabled = true;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  /** Call from a click handler to unlock audio on mobile. */
  unlock() {
    this.ensure();
  }

  private tone(
    freq: number,
    start: number,
    dur: number,
    opts: { type?: Wave; vol?: number; slideTo?: number; attack?: number } = {},
  ) {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.enabled) return;
    const { type = "sine", vol = 0.25, slideTo, attack = 0.008 } = opts;
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  private melody(
    notes: [number, number][],
    step: number,
    opts: { type?: Wave; vol?: number; offset?: number; sparkle?: boolean } = {},
  ) {
    const { offset = 0, sparkle = false, ...rest } = opts;
    notes.forEach(([f, len], i) => {
      const t = offset + i * step;
      this.tone(f, t, step * len * 1.1, rest);
      if (sparkle) this.tone(f * 2, t, step * len * 0.8, { type: "sine", vol: 0.06 });
    });
  }

  /** Soft kawaii tick while reels spin. */
  spinTick(i: number) {
    const scale = [880, 988, 1175, 1319, 1175, 988];
    this.tone(scale[i % scale.length] ?? 880, 0, 0.07, { type: "triangle", vol: 0.08 });
  }

  spinStart() {
    this.melody(
      [
        [659, 1],
        [784, 1],
        [988, 1],
        [1319, 2],
      ],
      0.06,
      { type: "triangle", vol: 0.14, sparkle: true },
    );
  }

  /** Three distinct stop sounds, one per reel. */
  reelStop(reel: number) {
    if (reel === 0) {
      this.tone(523, 0, 0.18, { type: "square", vol: 0.08, slideTo: 392 });
      this.tone(262, 0, 0.12, { type: "sine", vol: 0.2 });
    } else if (reel === 1) {
      this.tone(659, 0, 0.16, { type: "triangle", vol: 0.18 });
      this.tone(988, 0.05, 0.14, { type: "sine", vol: 0.12 });
    } else {
      this.tone(784, 0, 0.12, { type: "triangle", vol: 0.18 });
      this.tone(1175, 0.06, 0.12, { type: "triangle", vol: 0.14 });
      this.tone(1568, 0.12, 0.2, { type: "sine", vol: 0.1 });
    }
  }

  lose() {
    this.tone(440, 0, 0.18, { type: "triangle", vol: 0.12, slideTo: 330 });
    this.tone(330, 0.18, 0.28, { type: "triangle", vol: 0.1, slideTo: 262 });
  }

  /** Cheerful little win melody. */
  win() {
    this.melody(
      [
        [784, 1],
        [988, 1],
        [1175, 1],
        [1568, 3],
      ],
      0.09,
      { type: "triangle", vol: 0.18, sparkle: true },
    );
  }

  /** Fanfare scaled by multiplier size. */
  fanfare(multiplier: number) {
    const level = multiplier >= 250 ? 3 : multiplier >= 80 ? 2 : 1;
    const base: [number, number][] = [
      [523, 1],
      [659, 1],
      [784, 1],
      [1047, 2],
    ];
    this.melody(base, 0.11, { type: "square", vol: 0.09, sparkle: true });
    this.melody(base, 0.11, { type: "triangle", vol: 0.12 });
    if (level >= 2) {
      this.melody(
        [
          [784, 1],
          [1047, 1],
          [1319, 1],
          [1568, 3],
        ],
        0.11,
        { type: "square", vol: 0.08, offset: 0.6, sparkle: true },
      );
    }
    if (level >= 3) {
      // rising sparkle run
      for (let i = 0; i < 14; i++) {
        this.tone(1047 * Math.pow(2, i / 12), 1.15 + i * 0.04, 0.12, { type: "sine", vol: 0.07 });
      }
    }
  }

  /** Distinctive celebratory jackpot tune. */
  jackpot() {
    const tune: [number, number][] = [
      [784, 1],
      [784, 1],
      [1047, 2],
      [988, 1],
      [1047, 1],
      [1319, 2],
      [1175, 1],
      [1319, 1],
      [1568, 2],
      [2093, 4],
    ];
    this.melody(tune, 0.13, { type: "square", vol: 0.08, sparkle: true });
    this.melody(tune, 0.13, { type: "triangle", vol: 0.14 });
    // bass
    [262, 349, 392, 523].forEach((f, i) =>
      this.tone(f, i * 0.52, 0.5, { type: "sine", vol: 0.18 }),
    );
    // chime shower
    for (let i = 0; i < 20; i++) {
      const f = [1568, 2093, 2349, 2637][i % 4] ?? 2093;
      this.tone(f, 1.6 + i * 0.07, 0.15, { type: "sine", vol: 0.05 });
    }
  }

  /** Soft bubble-tea click (pop). */
  click() {
    this.tone(1200, 0, 0.06, { type: "sine", vol: 0.15, slideTo: 600 });
    this.tone(1800, 0.02, 0.05, { type: "sine", vol: 0.06 });
  }

  /** Rising coin blip while a win counter counts up. */
  countTick(i: number) {
    const f = 1319 + (i % 4) * 110 + Math.min(i, 30) * 14;
    this.tone(f, 0, 0.05, { type: "triangle", vol: 0.05 });
  }

  coins() {
    for (let i = 0; i < 6; i++) {
      this.tone(1319 + (i % 2) * 400, i * 0.06, 0.08, { type: "triangle", vol: 0.1 });
    }
  }
}

export const sound = new SoundEngine();
