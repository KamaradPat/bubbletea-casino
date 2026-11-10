import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, createRef } from "react";
import { ChevronLeft, ChevronRight, Coins, CupSoda, Loader2, Minus, Plus, RotateCcw, Volume2, VolumeX } from "lucide-react";

import { Bubbletea } from "@/components/casino/Bubbletea";
import { Celebration, type CelebrationData } from "@/components/casino/Celebration";
import { LoanDialog } from "@/components/casino/LoanDialog";
import { Modal } from "@/components/casino/Modal";
import { PandaWin, type PandaWinData } from "@/components/casino/PandaWin";
import { Paytable } from "@/components/casino/Paytable";
import { Reel, type ReelHandle } from "@/components/casino/Reel";
import { Stats } from "@/components/casino/Stats";
import { WinFlash, type WinFlashData } from "@/components/casino/WinFlash";
import { useCasino } from "@/hooks/use-casino";
import { useTweenNumber } from "@/hooks/use-tween-number";
import { formatCoins } from "@/lib/format";
import {
  MAX_BET,
  MIN_BET,
  SYMBOLS,
  celebrationFor,
  evaluate,
  maxAffordableBet,
  payout,
  spinLine,
  winTier,
  type SymbolDef,
} from "@/lib/slot";
import { sound } from "@/lib/sound";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bubbletea Panda Casino – Cute Deluxe" },
      {
        name: "description",
        content:
          "Nejroztomilejší pandí kasino na světě! Toč válce s Bubbletea, sbírej Pandí penízky a vyhraj pandí jackpot.",
      },
      { property: "og:title", content: "Bubbletea Panda Casino – Cute Deluxe" },
      {
        property: "og:description",
        content: "Kawaii hrací automat s pandou Bubbletea, zvuky, animacemi a pandím jackpotem.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Casino,
});

const BET_STEPS = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
const QUICK_BETS = [10, 50, 100, 500, 1000, 5000];
const REEL_DURATIONS = [1300, 1850, 2400];

// Deterministic starting faces so server and browser render the same reels.
const byId = (id: string) => SYMBOLS.find((s) => s.id === id)!;
const INITIAL_REELS: [SymbolDef, SymbolDef, SymbolDef][] = [
  [byId("sakura"), byId("panda"), byId("strawberry")],
  [byId("bamboo"), byId("boba"), byId("heart")],
  [byId("star"), byId("panda"), byId("dango")],
];

const WIN_LINES = ["Jupí!", "Hurá, výhra!", "Pandí štěstí!", "Ňam, to je sladké!", "Jsi hvězda!"];
const LOSE_LINES = [
  "Nevadí, příště to vyjde!",
  "Skoro! Zkus to znovu.",
  "Držím ti tlapky!",
  "Ještě jednou?",
];
const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)] ?? arr[0] ?? "";

type Msg = { text: string; tone: "info" | "win" | "warn" | "lose" };

function Casino() {
  const { state, placeBet, settle, borrow, setBet, newGame } = useCasino();
  const reels = useRef([createRef<ReelHandle>(), createRef<ReelHandle>(), createRef<ReelHandle>()]).current;

  const [spinning, setSpinning] = useState(false);
  const [highlight, setHighlight] = useState<number[]>([]);
  const [msg, setMsg] = useState<Msg>({ text: "Nastav sázku a zatoč!", tone: "info" });
  const [speech, setSpeech] = useState("Klikni na mě, půjčím ti penízky!");
  const [mood, setMood] = useState<"idle" | "happy">("idle");
  const [hop, setHop] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [loanOpen, setLoanOpen] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const [winFlash, setWinFlash] = useState<WinFlashData | null>(null);
  const [pandaWin, setPandaWin] = useState<PandaWinData | null>(null);
  const [floatWin, setFloatWin] = useState<{ id: number; amount: number } | null>(null);
  const [betDraft, setBetDraft] = useState<string | null>(null);

  useEffect(() => {
    sound.enabled = soundOn;
  }, [soundOn]);

  const cantAfford = state.balance < state.bet;
  const shownBalance = useTweenNumber(state.balance, 900);
  const shakeRef = useRef<HTMLDivElement>(null);

  const shakeScreen = (tier: "big" | "mega" | "jackpot") => {
    const el = shakeRef.current;
    if (!el?.animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const a = tier === "jackpot" ? 12 : tier === "mega" ? 8 : 5;
    el.animate(
      [
        { transform: "translate(0, 0)" },
        { transform: `translate(${-a}px, ${a / 2}px) rotate(-0.6deg)` },
        { transform: `translate(${a}px, ${-a / 2}px) rotate(0.6deg)` },
        { transform: `translate(${-a * 0.7}px, ${-a / 3}px)` },
        { transform: `translate(${a * 0.5}px, ${a / 3}px)` },
        { transform: `translate(${-a * 0.25}px, 0)` },
        { transform: "translate(0, 0)" },
      ],
      { duration: tier === "jackpot" ? 750 : 550, easing: "ease-out" },
    );
  };

  const pulseScreen = (scale: number) => {
    const el = shakeRef.current;
    if (!el?.animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate(
      [{ transform: "scale(1)" }, { transform: `scale(${scale})` }, { transform: "scale(1)" }, { transform: `scale(${1 + (scale - 1) / 2})` }, { transform: "scale(1)" }],
      { duration: 700, easing: "ease-in-out", composite: "add" },
    );
  };

  const spin = useCallback(async () => {
    if (spinning) return;
    sound.unlock();
    const bet = state.bet;
    if (!placeBet()) {
      setMsg({ text: "Nemáš dost Pandích penízků… Klikni na Bubbletea a půjč si!", tone: "warn" });
      setSpeech("Potřebuješ penízky? Klikni na mě!");
      setHop((h) => h + 1);
      sound.lose();
      return;
    }

    setSpinning(true);
    setWinFlash(null);
    setHighlight([]);
    setMood("idle");
    setMsg({ text: "Točí se… držím tlapky!", tone: "info" });
    setSpeech("Jů, točí se!");

    const targets = spinLine();
    const result = evaluate(targets);

    sound.spinStart();
    let tick = 0;
    const iv = window.setInterval(() => sound.spinTick(tick++), 95);

    let stopped = 0;
    await Promise.all(
      reels.map((r, i) =>
        (r.current?.spin(targets[i as 0 | 1 | 2], REEL_DURATIONS[i] ?? 2000) ?? Promise.resolve()).then(() => {
          sound.reelStop(i);
          stopped++;
          if (stopped === 3) window.clearInterval(iv);
        }),
      ),
    );
    window.clearInterval(iv);

    const win = payout(bet, result.multiplier);
    const id = Date.now();
    if (win > 0) {
      const repaid = settle(win, {
        multiplier: result.multiplier,
        emojis: targets.map((t) => t.emoji).join(""),
        id,
      });
      const tier = winTier(result.multiplier);
      const kind = celebrationFor(win, result.multiplier);
      setHighlight(result.winningReels);
      setMood("happy");
      setHop((h) => h + 1);
      setFloatWin({ id, amount: win - repaid });
      setSpeech(repaid > 0 ? `Díky! Splaceno ${formatCoins(repaid)}` : pick(WIN_LINES));
      setMsg({
        text:
          `Výhra +${formatCoins(win)} (×${result.multiplier})` +
          (repaid > 0 ? ` · ${formatCoins(repaid)} na splátku dluhu` : ""),
        tone: "win",
      });
      if (tier === "jackpot") sound.jackpot();
      else if (kind === "panda" || tier === "mega" || tier === "big") sound.fanfare(Math.max(result.multiplier, 80));
      else sound.win();
      pulseScreen(tier === "small" ? 1.012 : 1.03);
      if (kind === "panda") {
        shakeScreen("mega");
        window.setTimeout(() => setPandaWin({ id, win, multiplier: result.multiplier, repaid }), 250);
      } else if (tier === "small" || tier === "big") {
        if (tier === "big") shakeScreen(tier);
        setWinFlash({ id, tier, win, multiplier: result.multiplier });
      } else if (tier === "mega" || tier === "jackpot") {
        shakeScreen(tier);
        window.setTimeout(
          () =>
            setCelebration({
              id,
              tier,
              win,
              multiplier: result.multiplier,
              symbols: targets,
              winningReels: result.winningReels,
              repaid,
            }),
          250,
        );
      }
    } else {
      sound.lose();
      setMsg({ text: "Tentokrát nic… zkus to znovu!", tone: "lose" });
      setSpeech(pick(LOSE_LINES));
    }
    setSpinning(false);
  }, [spinning, state.bet, placeBet, settle, reels]);

  // Space bar spins
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || loanOpen || confirmNew || celebration || pandaWin) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "BUTTON")) return;
      e.preventDefault();
      void spin();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [spin, loanOpen, confirmNew, celebration, pandaWin]);

  const stepBet = (dir: 1 | -1) => {
    sound.unlock();
    sound.click();
    const cur = state.bet;
    const next =
      dir > 0 ? (BET_STEPS.find((s) => s > cur) ?? MAX_BET) : ([...BET_STEPS].reverse().find((s) => s < cur) ?? MIN_BET);
    setBet(next);
  };

  const openLoan = () => {
    sound.unlock();
    sound.click();
    setHop((h) => h + 1);
    setLoanOpen(true);
  };

  const closeCelebration = useCallback(() => setCelebration(null), []);
  const closeWinFlash = useCallback(() => setWinFlash(null), []);
  const closePandaWin = useCallback(() => setPandaWin(null), []);
  const closeLoan = useCallback(() => setLoanOpen(false), []);
  const closeConfirm = useCallback(() => setConfirmNew(false), []);

  return (
    <main className="relative mx-auto max-w-6xl px-3 pb-16 pt-4 sm:px-6 sm:pt-6">
      <div ref={shakeRef}>
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-extrabold leading-[0.95] tracking-tight sm:text-4xl">
            <span className="text-primary-deep">Bubbletea</span> <span className="text-secondary-deep">Panda</span>{" "}
            <span>Casino</span>
          </h1>
          <span className="mt-1 inline-block rounded-full bg-[image:var(--gradient-lav)] px-3 py-0.5 font-display text-xs font-extrabold tracking-[0.2em] text-accent-foreground sm:text-sm">
            CUTE DELUXE
          </span>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => {
              sound.unlock();
              setSoundOn((v) => {
                sound.enabled = !v;
                if (!v) sound.click();
                return !v;
              });
            }}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Vypnout zvuk" : "Zapnout zvuk"}
            className="flex size-11 items-center justify-center rounded-2xl border-[3px] border-border bg-card text-foreground shadow-[var(--shadow-soft)] transition hover:scale-105"
          >
            {soundOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              sound.unlock();
              sound.click();
              setConfirmNew(true);
            }}
            className="flex h-11 items-center gap-1.5 rounded-2xl bg-[image:var(--gradient-mint)] px-3 font-display text-sm font-extrabold text-secondary-foreground shadow-[var(--shadow-pop-mint)] transition active:translate-y-1"
          >
            <RotateCcw className="size-4" />
            <span>NOVÁ HRA</span>
          </button>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        {/* Machine column */}
        <div className="mx-auto w-full max-w-xl">
          {/* Wallet */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="kawaii-card relative px-3 py-2.5">
              <p className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                <Coins className="size-3.5" aria-hidden />
                Zůstatek
              </p>
              <p className="font-display text-2xl font-extrabold leading-tight tabular-nums sm:text-3xl" aria-hidden>
                {formatCoins(shownBalance)}
              </p>
              <span className="sr-only" aria-live="polite">
                {formatCoins(state.balance)}
              </span>
              <p className="text-[11px] font-semibold text-muted-foreground">Pandích penízků</p>
              {floatWin && floatWin.amount > 0 && (
                <span key={floatWin.id} aria-hidden className="pointer-events-none absolute inset-0">
                  <span className="animate-float-up absolute right-3 top-2 font-display text-xl font-extrabold text-secondary-deep">
                    +{formatCoins(floatWin.amount)}
                  </span>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={openLoan}
              className={cn(
                "kawaii-card px-3 py-2.5 text-left transition hover:scale-[1.02]",
                state.debt > 0 && "border-primary",
              )}
            >
              <p className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                <CupSoda className="size-3.5" aria-hidden />
                Dluh u Bubbletea
              </p>
              <p
                className={cn(
                  "font-display text-2xl font-extrabold leading-tight sm:text-3xl",
                  state.debt > 0 ? "text-primary-deep" : "text-secondary-deep",
                )}
              >
                {formatCoins(state.debt)}
              </p>
              <p className="text-[11px] font-semibold text-primary-deep">Půjčit si ›</p>
            </button>
          </div>

          {/* Bubbletea on top of the machine */}
          <div className="relative z-10 mt-3 flex items-end justify-center gap-1">
            <div className="mb-16 flex max-w-[11rem] flex-1 justify-end sm:max-w-[14rem]">
              <div
                key={speech}
                className="animate-pop-in rounded-3xl rounded-br-md bg-card px-3 py-2 text-sm font-bold shadow-[var(--shadow-soft)] sm:text-base"
              >
                {speech}
              </div>
            </div>
            <Bubbletea
              className="-mb-10 w-36 sm:-mb-12 sm:w-44"
              mood={mood}
              hopKey={hop}
              onClick={openLoan}
              label="Bubbletea – klikni a půjč si Pandí penízky"
            />
          </div>

          {/* Machine */}
          <section
            className={cn("machine-frame relative px-3 pb-4 pt-12 sm:px-5 sm:pt-14", (celebration || pandaWin) && "animate-machine-flash")}
            aria-label="Hrací automat"
          >
            {/* marquee bulbs */}
            <div className="absolute inset-x-6 top-3 flex justify-between" aria-hidden>
              {Array.from({ length: 12 }, (_, i) => (
                <span
                  key={i}
                  className="animate-bulb size-2.5 rounded-full"
                  style={{ animationDelay: `${(i % 2) * -0.6}s` }}
                />
              ))}
            </div>

            <div className="relative rounded-[1.6rem] bg-card/60 p-2 sm:p-3">
              {winFlash && <WinFlash key={winFlash.id} data={winFlash} onDone={closeWinFlash} />}
              <div className="flex gap-2 sm:gap-3">
                {reels.map((r, i) => (
                  <Reel key={i} ref={r} index={i} initial={INITIAL_REELS[i] ?? INITIAL_REELS[0]!} highlight={highlight.includes(i)} />
                ))}
              </div>
              {/* payline */}
              <div className="pointer-events-none absolute inset-x-1 top-1/2 flex -translate-y-1/2 items-center justify-between" aria-hidden>
                <ChevronRight className="size-6 text-primary-deep drop-shadow" strokeWidth={3.5} />
                <ChevronLeft className="size-6 text-primary-deep drop-shadow" strokeWidth={3.5} />
              </div>
            </div>

            {/* message */}
            <p
              className={cn(
                "mt-3 min-h-[2.75rem] rounded-2xl px-3 py-2 text-center font-display text-base font-bold leading-tight sm:text-lg",
                msg.tone === "win" && "animate-pop-in bg-gold text-gold-foreground",
                msg.tone === "warn" && "animate-wiggle bg-destructive text-destructive-foreground",
                msg.tone === "lose" && "bg-card/70 text-muted-foreground",
                msg.tone === "info" && "bg-card/70",
              )}
              aria-live="polite"
            >
              {msg.text}
            </p>

            {/* Controls */}
            <div className="mt-3 rounded-[1.6rem] bg-card/80 p-3">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-extrabold text-muted-foreground">SÁZKA</span>
                <button
                  type="button"
                  onClick={() => stepBet(-1)}
                  disabled={spinning || state.bet <= MIN_BET}
                  aria-label="Snížit sázku"
                  className="btn-pop flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[image:var(--gradient-lav)] text-accent-foreground shadow-[var(--shadow-pop-lav)]"
                >
                  <Minus className="size-5" />
                </button>
                <input
                  inputMode="numeric"
                  aria-label="Výše sázky"
                  value={betDraft ?? formatCoins(state.bet)}
                  disabled={spinning}
                  onFocus={() => setBetDraft(String(state.bet))}
                  onChange={(e) => setBetDraft(e.target.value.replace(/[^\d]/g, ""))}
                  onBlur={() => {
                    if (betDraft !== null) setBet(Number(betDraft || MIN_BET));
                    setBetDraft(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  className="h-11 min-w-0 flex-1 rounded-2xl border-[3px] border-border bg-cream text-center font-display text-xl font-extrabold outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => stepBet(1)}
                  disabled={spinning || state.bet >= MAX_BET}
                  aria-label="Zvýšit sázku"
                  className="btn-pop flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[image:var(--gradient-lav)] text-accent-foreground shadow-[var(--shadow-pop-lav)]"
                >
                  <Plus className="size-5" />
                </button>
              </div>

              <div className="mt-2 grid grid-cols-6 gap-1.5">
                {QUICK_BETS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    disabled={spinning}
                    onClick={() => {
                      sound.unlock();
                      sound.click();
                      setBet(b);
                    }}
                    className={cn(
                      "rounded-xl border-2 py-1 font-display text-xs font-bold transition sm:text-sm",
                      state.bet === b ? "border-primary-deep bg-primary-deep text-primary-foreground" : "border-border bg-cream",
                    )}
                  >
                    {b >= 1000 ? `${b / 1000}k` : b}
                  </button>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-[1fr_1.6fr] gap-2.5">
                <button
                  type="button"
                  disabled={spinning}
                  onClick={() => {
                    sound.unlock();
                    sound.click();
                    setBet(maxAffordableBet(state.balance));
                  }}
                  className="btn-pop rounded-2xl bg-[image:var(--gradient-gold)] py-3 font-display text-base font-extrabold leading-none text-gold-foreground shadow-[var(--shadow-pop-gold)] sm:text-lg"
                >
                  MAX
                  <br />
                  SÁZKA
                </button>
                <button
                  type="button"
                  onClick={() => void spin()}
                  disabled={spinning}
                  className={cn(
                    "btn-pop rounded-2xl bg-[image:var(--gradient-spin)] py-3 font-display text-3xl font-extrabold tracking-wide text-primary-foreground",
                    !spinning && !cantAfford && "animate-pulse-big",
                  )}
                >
                  {spinning ? <Loader2 className="mx-auto size-8 animate-spin" aria-label="Točí se" /> : "TOČIT!"}
                </button>
              </div>
              {cantAfford && !spinning && (
                <button
                  type="button"
                  onClick={openLoan}
                  className="mt-2 w-full text-center text-sm font-bold text-primary-deep underline underline-offset-4"
                >
                  Málo penízků? Půjč si od Bubbletea
                </button>
              )}
              <p className="mt-2 hidden text-center text-xs text-muted-foreground sm:block">
                Tip: mezerníkem taky zatočíš
              </p>
            </div>
          </section>
        </div>

        {/* Side column */}
        <aside className="mx-auto grid w-full max-w-xl gap-5">
          <Stats state={state} />
          <Paytable />
        </aside>
      </div>

      <footer className="mt-10 text-center text-xs text-muted-foreground">
        Jen pro zábavu – hraje se o virtuální Pandí penízky, ne o skutečné peníze.
        <br />
        <span className="opacity-70">Obrázky symbolů: Twemoji (CC-BY 4.0)</span>
      </footer>
      </div>

      <LoanDialog
        open={loanOpen}
        debt={state.debt}
        onClose={closeLoan}
        onPick={() => sound.click()}
        onBorrow={(amount) => {
          borrow(amount);
          sound.coins();
          setLoanOpen(false);
          setMood("happy");
          setHop((h) => h + 1);
          setSpeech(`Tady máš ${formatCoins(amount)}! Hodně štěstí!`);
          setMsg({ text: `Bubbletea ti půjčila ${formatCoins(amount)} Pandích penízků`, tone: "info" });
        }}
      />

      <Modal open={confirmNew} onClose={closeConfirm} labelledBy="new-title">
        <div className="flex flex-col items-center text-center">
          <Bubbletea className="w-24" />
          <h2 id="new-title" className="mt-2 font-display text-2xl font-extrabold">
            Začít novou hru?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Zůstatek se vrátí na {formatCoins(10000)} Pandích penízků, dluh i statistiky se vynulují.
          </p>
          <div className="mt-5 flex w-full gap-2">
            <button
              type="button"
              onClick={closeConfirm}
              className="flex-1 rounded-2xl border-[3px] border-border bg-card py-3 font-display font-bold"
            >
              Zpět
            </button>
            <button
              type="button"
              onClick={() => {
                newGame();
                sound.coins();
                setConfirmNew(false);
                setHighlight([]);
                setMood("idle");
                setHop((h) => h + 1);
                setSpeech("Nová hra, nové štěstí!");
                setMsg({ text: "Nová hra! Máš 10 000 Pandích penízků", tone: "info" });
              }}
              className="btn-pop flex-[1.4] rounded-2xl bg-[image:var(--gradient-spin)] py-3 font-display text-lg font-extrabold text-primary-foreground"
            >
              Nová hra
            </button>
          </div>
        </div>
      </Modal>

      {celebration && <Celebration key={celebration.id} data={celebration} onClose={closeCelebration} />}
      {pandaWin && <PandaWin key={pandaWin.id} data={pandaWin} onClose={closePandaWin} />}
    </main>
  );
}
