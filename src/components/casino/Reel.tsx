import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { randomSymbol, type SymbolDef } from "@/lib/slot";
import { cn } from "@/lib/utils";
import { SymbolIcon } from "./SymbolIcon";

export type ReelHandle = {
  spin: (target: SymbolDef, durationMs: number) => Promise<void>;
};

type Props = {
  ref?: Ref<ReelHandle>;
  index: number;
  initial: SymbolDef[]; // 3 symbols: above, center, below
  highlight?: boolean;
};

export function Reel({ ref, index, initial, highlight }: Props) {
  const [strip, setStrip] = useState<SymbolDef[]>(initial);
  const [offset, setOffset] = useState(0);
  const [transition, setTransition] = useState<string>("none");
  const [blur, setBlur] = useState(false);
  const stripRef = useRef(strip);
  stripRef.current = strip;

  useImperativeHandle(ref, () => ({
    spin(target, durationMs) {
      return new Promise<void>((resolve) => {
        const current = stripRef.current.slice(0, 3);
        const fillerCount = 22 + index * 8;
        const fillers = Array.from({ length: fillerCount }, () => randomSymbol());
        const above = randomSymbol();
        const below = randomSymbol();
        // Strip moves downward: target block on top, current block at the bottom.
        const next = [above, target, below, ...fillers, ...current];
        const startPct = -((next.length - 3) / next.length) * 100;
        setTransition("none");
        setStrip(next);
        setOffset(startPct);
        setBlur(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTransition(`transform ${durationMs}ms cubic-bezier(0.25, 0.1, 0.25, 1.08)`);
            setOffset(0);
          });
        });
        window.setTimeout(() => setBlur(false), Math.max(0, durationMs - 380));
        window.setTimeout(() => {
          setTransition("none");
          setStrip([above, target, below]);
          setOffset(0);
          resolve();
        }, durationMs + 40);
      });
    },
  }));

  return (
    <div className="reel-window relative h-60 flex-1 overflow-hidden sm:h-72">
      <div
        className={cn("absolute inset-x-0 top-0 will-change-transform", blur && "blur-[1.5px]")}
        style={{
          transform: `translate3d(0, ${offset}%, 0)`,
          transition,
          height: `${(strip.length / 3) * 100}%`,
        }}
      >
        {strip.map((s, i) => (
          <div
            key={i}
            className="flex items-center justify-center"
            style={{ height: `${100 / strip.length}%` }}
          >
            <span
              className={cn(
                "flex size-16 items-center justify-center rounded-2xl sm:size-20",
                i === 1 && strip.length === 3 && highlight && "animate-win-glow bg-cream",
              )}
              aria-hidden={i !== 1}
            >
              <SymbolIcon symbol={s} decorative={i !== 1} className="size-12 sm:size-14" />
            </span>
          </div>
        ))}
      </div>
      {/* soft fades top & bottom */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-reel to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-reel to-transparent" />
    </div>
  );
}
