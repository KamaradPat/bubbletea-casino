import { useEffect, useState, type CSSProperties } from "react";
import type { SymbolDef, WinTier } from "@/lib/slot";
import { formatCoins } from "@/lib/format";
import { sound } from "@/lib/sound";
import { useTweenNumber } from "@/hooks/use-tween-number";
import { cn } from "@/lib/utils";
import { Bubbletea } from "./Bubbletea";
import { PandaCoin, PandaFace } from "./PandaCoin";
import { SymbolIcon } from "./SymbolIcon";

export type CelebrationData = {
  id: number;
  tier: Exclude<WinTier, "none" | "small">;
  win: number;
  multiplier: number;
  symbols: readonly SymbolDef[];
  winningReels: number[];
  repaid: number;
};

const CONFETTI = ["bg-primary", "bg-secondary", "bg-accent", "bg-gold", "bg-primary-deep", "bg-secondary-deep"];
const SPARK = ["bg-gold", "bg-primary", "bg-secondary", "bg-cream", "bg-accent"];

const TIER = {
  big: {
    label: "Super výhra!",
    title: "SUPER!",
    coins: 18,
    pandas: 0,
    confetti: 28,
    sparks: 22,
    text: "text-6xl sm:text-8xl",
    countMs: 1600,
    closeMs: 7500,
    shake: "5px",
    waves: false,
  },
  mega: {
    label: "Mega výhra!",
    title: "MEGA!",
    coins: 30,
    pandas: 8,
    confetti: 46,
    sparks: 34,
    text: "text-7xl sm:text-8xl",
    countMs: 2100,
    closeMs: 9000,
    shake: "8px",
    waves: true,
  },
  jackpot: {
    label: "Pandí jackpot!",
    title: "JACKPOT!",
    coins: 48,
    pandas: 18,
    confetti: 70,
    sparks: 48,
    text: "text-6xl sm:text-8xl",
    countMs: 2800,
    closeMs: 11000,
    shake: "12px",
    waves: true,
  },
} as const;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pickOne = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)] ?? arr[0]!;

function makeCoins(n: number) {
  return Array.from({ length: n }, (_, id) => ({
    id,
    left: rand(0, 96),
    delay: rand(0, 2.2),
    dur: rand(2.4, 4.4),
    drift: rand(-120, 120),
    size: rand(28, 54),
    flip: rand(0.45, 1.1),
  }));
}

function makeConfetti(n: number) {
  return Array.from({ length: n }, (_, id) => ({
    id,
    left: rand(0, 100),
    delay: rand(0, 2.5),
    dur: rand(2.8, 5),
    drift: rand(-160, 160),
    spin: rand(-900, 900),
    w: rand(7, 12),
    h: rand(12, 20),
    color: pickOne(CONFETTI),
  }));
}

function makeSparks(n: number, minDist: number, maxDist: number) {
  return Array.from({ length: n }, (_, id) => {
    const angle = (id / n) * Math.PI * 2 + rand(-0.15, 0.15);
    const dist = rand(minDist, maxDist);
    return {
      id,
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist,
      size: rand(6, 15),
      delay: rand(0, 0.25),
      dur: rand(0.8, 1.4),
      color: pickOne(SPARK),
      star: Math.random() < 0.5,
    };
  });
}

function makeRisers(n: number) {
  return Array.from({ length: n }, (_, id) => ({
    id,
    left: rand(2, 98),
    top: rand(15, 85),
    delay: rand(0, 1.2),
    size: rand(7, 13),
    color: pickOne(SPARK),
  }));
}

type Spark = ReturnType<typeof makeSparks>[number];

function Burst({ sparks }: { sparks: Spark[] }) {
  return (
    <>
      {sparks.map((s) => (
        <span
          key={s.id}
          className={cn("animate-burst absolute left-0 top-0 block", s.color, s.star ? "sparkle-star" : "spark-glow rounded-full")}
          style={
            {
              width: s.size,
              height: s.size,
              "--tx": `${s.tx}px`,
              "--ty": `${s.ty}px`,
              "--delay": `${s.delay}s`,
              "--dur": `${s.dur}s`,
            } as CSSProperties
          }
        />
      ))}
    </>
  );
}

export function Celebration({ data, onClose }: { data: CelebrationData; onClose: () => void }) {
  const cfg = TIER[data.tier];
  const [coins] = useState(() => makeCoins(cfg.coins));
  const [pandas] = useState(() => makeCoins(cfg.pandas));
  const [confetti] = useState(() => makeConfetti(cfg.confetti));
  const [sparks] = useState(() => makeSparks(cfg.sparks, 140, 420));
  const [landSparks] = useState(() => makeSparks(20, 70, 170));
  const [risers] = useState(() => makeRisers(14));
  const [wave, setWave] = useState(0);
  const amount = useTweenNumber(data.win, cfg.countMs, 0);
  const mult = useTweenNumber(data.multiplier, 1200, 0);
  const done = amount >= data.win;

  // Mega wins and jackpots keep raining in waves
  useEffect(() => {
    if (!cfg.waves) return;
    const t = window.setInterval(() => setWave((w) => w + 1), 3200);
    return () => window.clearInterval(t);
  }, [cfg.waves]);

  useEffect(() => {
    const t = window.setTimeout(onClose, cfg.closeMs);
    return () => window.clearTimeout(t);
  }, [onClose, cfg.closeMs]);

  // Coin ticks while the counter runs, a coin shower when it lands
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
      className="animate-fade-in fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-[image:var(--gradient-celebrate)] p-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={cfg.label}
    >
      {/* rotating light rays */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[42%] size-[180vmax] -translate-x-1/2 -translate-y-1/2"
      >
        <div className="animate-rays size-full rounded-full bg-[image:var(--gradient-rays)] [mask-image:radial-gradient(circle,black_8%,transparent_52%)]" />
      </div>

      {/* shockwave rings + glowing particle burst */}
      <div key={`burst-${wave}`} aria-hidden className="pointer-events-none absolute left-1/2 top-[42%]">
        {[0, 0.22, 0.44].map((d) => (
          <span
            key={d}
            className="animate-shockwave absolute left-0 top-0 block size-40 rounded-full border-4 border-gold"
            style={{ animationDelay: `${d}s` }}
          />
        ))}
        <Burst sparks={sparks} />
      </div>

      {/* raining panda coins and confetti */}
      <div key={`rain-${wave}`} aria-hidden className="pointer-events-none absolute inset-0">
        {confetti.map((c) => (
          <span
            key={`c${c.id}`}
            className="animate-fall absolute top-0 block"
            style={
              {
                left: `${c.left}%`,
                "--delay": `${c.delay}s`,
                "--dur": `${c.dur}s`,
                "--drift": `${c.drift}px`,
                "--spin": `${c.spin}deg`,
              } as CSSProperties
            }
          >
            <span className={cn("animate-flutter block rounded-sm", c.color)} style={{ width: c.w, height: c.h }} />
          </span>
        ))}
        {coins.map((c) => (
          <span
            key={`k${c.id}`}
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
        {pandas.map((c) => (
          <span
            key={`p${c.id}`}
            className="animate-fall absolute top-0 block"
            style={
              {
                left: `${c.left}%`,
                width: c.size * 0.9,
                "--delay": `${c.delay + 0.4}s`,
                "--dur": `${c.dur + 0.8}s`,
                "--drift": `${c.drift}px`,
                "--spin": `${c.drift * 3}deg`,
              } as CSSProperties
            }
          >
            <PandaFace className="block w-full drop-shadow-[var(--drop-coin)]" />
          </span>
        ))}
      </div>

      <div
        className="animate-screen-shake relative w-full max-w-xl"
        style={{ "--shake": cfg.shake } as CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="animate-jackpot-in flex flex-col items-center text-center">
          <p className="animate-neon rounded-full border-[3px] border-primary bg-card px-5 py-1.5 font-display text-lg font-extrabold uppercase tracking-[0.15em] text-primary-deep">
            {cfg.label}
          </p>

          <div
            className={cn(
              "mt-3 rounded-[2rem] px-5 py-1",
              data.tier === "jackpot" && "animate-neon-banner border-4 border-gold bg-card/80",
            )}
          >
            <h2
              className={cn(
                "text-jackpot animate-pulse-big font-display font-extrabold leading-none drop-shadow-[0_6px_0_oklch(0.99_0.01_80)]",
                cfg.text,
              )}
            >
              {cfg.title}
            </h2>
          </div>

          <div className="relative mt-1">
            <span aria-hidden className="animate-halo absolute -inset-[14%] rounded-full bg-[image:var(--gradient-halo)]" />
            <Bubbletea className="relative w-36 sm:w-44" mood="happy" bounceLoop />
          </div>

          <div className="relative -mt-2 flex gap-3">
            {data.symbols.map((s, i) => (
              <span
                key={i}
                className={cn(
                  "flex size-16 items-center justify-center rounded-2xl bg-card sm:size-20",
                  data.winningReels.includes(i) ? "animate-win-glow" : "opacity-60",
                )}
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <SymbolIcon symbol={s} className="size-11 sm:size-14" />
              </span>
            ))}
          </div>

          <div className="animate-wiggle mt-5 rounded-full bg-[image:var(--gradient-gold)] px-6 py-1 font-display text-4xl font-extrabold text-gold-foreground shadow-[var(--shadow-pop-gold)] sm:text-5xl">
            ×{Math.round(mult)}
          </div>

          {/* win counter with glowing sparkles */}
          <div className="relative mt-4 px-6">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              {!done &&
                risers.map((r) => (
                  <span
                    key={r.id}
                    className={cn("sparkle-star animate-sparkle-rise absolute block", r.color)}
                    style={{
                      left: `${r.left}%`,
                      top: `${r.top}%`,
                      width: r.size,
                      height: r.size,
                      animationDelay: `${r.delay}s`,
                    }}
                  />
                ))}
            </div>
            {done && (
              <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
                <Burst sparks={landSparks} />
              </div>
            )}
            <p
              className={cn(
                "text-glow-gold relative flex items-center justify-center gap-2 font-display text-4xl font-extrabold tabular-nums text-primary-foreground sm:text-5xl",
                done && "animate-count-land",
              )}
            >
              +{formatCoins(amount)}
              <PandaCoin className="size-10 sm:size-12" />
            </p>
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
