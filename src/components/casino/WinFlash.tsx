import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { formatCoins } from "@/lib/format";
import { sound } from "@/lib/sound";
import { useTweenNumber } from "@/hooks/use-tween-number";
import { cn } from "@/lib/utils";
import { PandaCoin } from "./PandaCoin";

export type WinFlashData = {
  id: number;
  tier: "small" | "big";
  win: number;
  multiplier: number;
};

const CFG = {
  small: { label: "VÝHRA!", inner: 12, screen: 0, ms: 2600, countMs: 900 },
  big: { label: "VELKÁ VÝHRA!", inner: 18, screen: 30, ms: 3800, countMs: 1500 },
} as const;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function makeCoins(n: number, spread: number) {
  return Array.from({ length: n }, (_, id) => ({
    id,
    left: rand(0, 94),
    delay: rand(0, spread),
    dur: rand(1.4, 2.6),
    drift: rand(-60, 60),
    size: rand(22, 40),
    flip: rand(0.4, 0.9),
  }));
}

type Coin = ReturnType<typeof makeCoins>[number];

function CoinRain({ coins, fallFrom, fallTo }: { coins: Coin[]; fallFrom: string; fallTo: string }) {
  return (
    <>
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
              "--fall-from": fallFrom,
              "--fall-to": fallTo,
            } as CSSProperties
          }
        >
          <span className="animate-coin-flip block" style={{ "--flip": `${c.flip}s` } as CSSProperties}>
            <PandaCoin className="block w-full drop-shadow-[var(--drop-coin)]" />
          </span>
        </span>
      ))}
    </>
  );
}

/**
 * Win toast laid over the reels: count-up amount, coins dropping through the
 * reel window and, for big wins, a full-screen golden flash with a coin shower.
 * Never blocks input — the next spin simply replaces it.
 */
export function WinFlash({ data, onDone }: { data: WinFlashData; onDone: () => void }) {
  const cfg = CFG[data.tier];
  const [inner] = useState(() => makeCoins(cfg.inner, 0.9));
  const [screen] = useState(() => makeCoins(cfg.screen, 1.4));
  const [mounted, setMounted] = useState(false);
  const amount = useTweenNumber(data.win, cfg.countMs, 0);
  const done = amount >= data.win;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const t = window.setTimeout(onDone, cfg.ms);
    return () => window.clearTimeout(t);
  }, [onDone, cfg.ms]);

  useEffect(() => {
    if (done || data.tier !== "big") return;
    let i = 0;
    const t = window.setInterval(() => sound.countTick(i++), 90);
    return () => window.clearInterval(t);
  }, [done, data.tier]);

  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[inherit]">
        <div className="animate-reel-flash absolute inset-0 bg-[image:var(--gradient-halo)]" />
        <CoinRain coins={inner} fallFrom="-60px" fallTo="420px" />
        <div className="absolute inset-0 flex items-center justify-center p-3">
          <div
            className="animate-win-toast flex flex-col items-center rounded-[1.75rem] border-4 border-gold bg-card/95 px-5 py-2.5 text-center shadow-[var(--glow-gold)]"
            style={{ "--toast": `${cfg.ms}ms` } as CSSProperties}
          >
            <span
              className={cn(
                "text-jackpot font-display font-extrabold leading-none",
                data.tier === "big" ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl",
              )}
            >
              {cfg.label}
            </span>
            <span
              className={cn(
                "mt-1 flex items-center gap-1.5 font-display text-3xl font-extrabold tabular-nums text-secondary-deep sm:text-4xl",
                done && "animate-count-land",
              )}
            >
              +{formatCoins(amount)}
              <PandaCoin className="size-8 sm:size-9" />
            </span>
            <span className="mt-1 rounded-full bg-[image:var(--gradient-gold)] px-3 font-display text-sm font-extrabold text-gold-foreground">
              ×{data.multiplier}
            </span>
          </div>
        </div>
      </div>
      {mounted &&
        data.tier === "big" &&
        createPortal(
          <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            <div className="animate-screen-flash absolute inset-0 bg-[image:var(--gradient-halo)]" />
            <CoinRain coins={screen} fallFrom="-12vh" fallTo="112vh" />
          </div>,
          document.body,
        )}
    </>
  );
}
