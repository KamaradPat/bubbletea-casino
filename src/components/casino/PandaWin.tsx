import { useEffect, useState, type CSSProperties } from "react";
import { Heart } from "lucide-react";
import { formatCoins } from "@/lib/format";
import { sound } from "@/lib/sound";
import { useTweenNumber } from "@/hooks/use-tween-number";
import { cn } from "@/lib/utils";
import { Bubbletea } from "./Bubbletea";
import { PandaCoin } from "./PandaCoin";

export type PandaWinData = { id: number; win: number; multiplier: number; repaid: number };

const COUNT_MS = 2400;
const CLOSE_MS = 10_000;
const HEART_COLORS = ["text-primary-deep", "text-primary", "text-accent", "text-secondary-deep"];

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function makeCoins(n: number) {
  return Array.from({ length: n }, (_, id) => ({
    id,
    left: rand(0, 96),
    delay: rand(0, 2.6),
    dur: rand(2.8, 4.8),
    drift: rand(-80, 80),
    size: rand(26, 50),
    flip: rand(0.5, 1.1),
  }));
}

function makeHearts(n: number) {
  return Array.from({ length: n }, (_, id) => ({
    id,
    left: rand(4, 96),
    delay: rand(0, 3),
    dur: rand(2.6, 4.2),
    size: rand(16, 30),
    sway: rand(-40, 40),
    color: HEART_COLORS[id % HEART_COLORS.length]!,
  }));
}

/** Special cute celebration for wins of 10 000 Pandí penízky or more. */
export function PandaWin({ data, onClose }: { data: PandaWinData; onClose: () => void }) {
  const [coins] = useState(() => makeCoins(36));
  const [hearts] = useState(() => makeHearts(14));
  const [wave, setWave] = useState(0);
  const amount = useTweenNumber(data.win, COUNT_MS, 0);
  const done = amount >= data.win;

  useEffect(() => {
    const t = window.setInterval(() => setWave((w) => w + 1), 3400);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(onClose, CLOSE_MS);
    return () => window.clearTimeout(t);
  }, [onClose]);

  useEffect(() => {
    if (done) {
      sound.coins();
      return;
    }
    let i = 0;
    const t = window.setInterval(() => sound.countTick(i++), 85);
    return () => window.clearInterval(t);
  }, [done]);

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-[image:var(--gradient-panda-aura)] p-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Mega výhra"
    >
      {/* panda coins raining from the top */}
      <div key={`rain-${wave}`} aria-hidden className="pointer-events-none absolute inset-0">
        {coins.map((c) => (
          <span
            key={c.id}
            className="animate-fall absolute top-0 block"
            style={
              {
                left: `${c.left}%`,
                width: c.size,
                "--delay": `${c.delay}s`,
                "--dur": `${c.dur}s`,
                "--drift": `${c.drift}px`,
                "--spin": "0deg",
              } as CSSProperties
            }
          >
            <span className="animate-coin-flip block" style={{ "--flip": `${c.flip}s` } as CSSProperties}>
              <PandaCoin className="block w-full drop-shadow-[var(--drop-coin)]" />
            </span>
          </span>
        ))}
      </div>

      {/* hearts drifting up */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {hearts.map((h) => (
          <span
            key={h.id}
            className={cn("animate-heart-float absolute bottom-0 block", h.color)}
            style={
              {
                left: `${h.left}%`,
                "--delay": `${h.delay}s`,
                "--dur": `${h.dur}s`,
                "--sway": `${h.sway}px`,
              } as CSSProperties
            }
          >
            <Heart fill="currentColor" strokeWidth={0} style={{ width: h.size, height: h.size }} />
          </span>
        ))}
      </div>

      <div className="relative w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        <div className="animate-jackpot-in flex flex-col items-center text-center">
          {/* glowing banner */}
          <div className="animate-pink-banner rounded-[2rem] border-4 border-primary bg-card/90 px-6 py-2">
            <h2 className="text-jackpot font-display text-5xl font-extrabold leading-none sm:text-7xl">MEGA VÝHRA!</h2>
          </div>
          <p className="mt-2 rounded-full bg-[image:var(--gradient-lav)] px-4 py-1 font-display text-sm font-extrabold uppercase tracking-[0.18em] text-accent-foreground">
            Super pandí výhra
          </p>

          {/* Bubbletea in a soft pink aura, holding hearts */}
          <div className="relative mt-4">
            <span aria-hidden className="animate-aura absolute -inset-[30%] rounded-full bg-[image:var(--gradient-pink-aura)]" />
            <Bubbletea className="relative w-40 sm:w-48" mood="happy" bounceLoop />
            <span aria-hidden className="animate-heart-hold absolute -left-6 top-[38%] text-primary-deep">
              <Heart fill="currentColor" strokeWidth={0} className="size-12 drop-shadow-[var(--glow-pink)] sm:size-14" />
            </span>
            <span
              aria-hidden
              className="animate-heart-hold absolute -right-6 top-[38%] text-primary-deep"
              style={{ animationDelay: "-0.6s" }}
            >
              <Heart fill="currentColor" strokeWidth={0} className="size-12 drop-shadow-[var(--glow-pink)] sm:size-14" />
            </span>
            <span
              aria-hidden
              className="animate-heart-hold absolute left-1/2 -top-6 -translate-x-1/2 text-primary"
              style={{ animationDelay: "-1.1s" }}
            >
              <Heart fill="currentColor" strokeWidth={0} className="size-9" />
            </span>
          </div>

          {/* bouncing counter */}
          <div className="mt-4 rounded-[1.75rem] border-4 border-primary bg-card/90 px-6 py-2 shadow-[var(--glow-pink)]">
            <p
              className={cn(
                "flex items-center justify-center gap-2 font-display text-4xl font-extrabold tabular-nums text-primary-deep sm:text-6xl",
                done ? "animate-count-land" : "animate-count-bounce",
              )}
            >
              +{formatCoins(amount)}
              <PandaCoin className="size-10 sm:size-14" />
            </p>
            <p className="text-sm font-bold text-muted-foreground">Pandích penízků · ×{data.multiplier}</p>
          </div>

          {data.repaid > 0 && (
            <p className="mt-2 rounded-full bg-secondary px-4 py-1 text-sm font-bold text-secondary-foreground">
              {formatCoins(data.repaid)} šlo na splacení dluhu u Bubbletea
            </p>
          )}

          <button
            type="button"
            onClick={onClose}
            className="btn-pop mt-6 rounded-full bg-[image:var(--gradient-spin)] px-8 py-3 font-display text-xl font-extrabold text-primary-foreground"
          >
            Hurá! Hrát dál
          </button>
        </div>
      </div>
    </div>
  );
}
