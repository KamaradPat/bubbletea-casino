// Pure slot-machine rules: symbols, weights, paytable and economy.
// No randomness at module scope (Workers forbid it) — RNG is passed in.

export type SymbolDef = {
  id: string;
  emoji: string;
  name: string;
  /** How often the symbol shows up on the reels and in pairs. */
  weight: number;
  /** Share of the three-of-a-kind outcomes made of this symbol. */
  luck: number;
  /** Multiplier of the bet for three of a kind on the payline. */
  triple: number;
};

export const SYMBOLS: SymbolDef[] = [
  { id: "panda", emoji: "🐼", name: "Panda", weight: 2, luck: 3, triple: 2000 },
  { id: "boba", emoji: "🧋", name: "Bubble tea", weight: 3, luck: 3, triple: 500 },
  { id: "greenheart", emoji: "💚", name: "Zelené srdíčko", weight: 4, luck: 3, triple: 250 },
  { id: "bamboo", emoji: "🎋", name: "Bambus", weight: 5, luck: 3, triple: 200 },
  { id: "rainbow", emoji: "🌈", name: "Duha", weight: 5, luck: 3, triple: 150 },
  { id: "star", emoji: "⭐", name: "Hvězdička", weight: 6, luck: 6, triple: 100 },
  { id: "heart", emoji: "💗", name: "Srdíčko", weight: 6, luck: 6, triple: 100 },
  { id: "bow", emoji: "🎀", name: "Mašlička", weight: 7, luck: 10, triple: 80 },
  { id: "matcha", emoji: "🍵", name: "Matcha", weight: 7, luck: 10, triple: 80 },
  { id: "dango", emoji: "🍡", name: "Dango", weight: 7, luck: 18, triple: 60 },
  { id: "cake", emoji: "🍰", name: "Dortík", weight: 7, luck: 18, triple: 60 },
  { id: "bunny", emoji: "🐰", name: "Zajíček", weight: 7, luck: 18, triple: 60 },
  { id: "kitty", emoji: "🐱", name: "Kočička", weight: 7, luck: 18, triple: 60 },
  { id: "butterfly", emoji: "🦋", name: "Motýlek", weight: 7, luck: 26, triple: 50 },
  { id: "sakura", emoji: "🌸", name: "Sakura", weight: 8, luck: 40, triple: 40 },
  { id: "paw", emoji: "🐾", name: "Tlapky", weight: 8, luck: 40, triple: 40 },
  { id: "bubbles", emoji: "🫧", name: "Bublinky", weight: 8, luck: 40, triple: 40 },
  { id: "candy", emoji: "🍬", name: "Bonbon", weight: 8, luck: 70, triple: 30 },
  { id: "narutomaki", emoji: "🍥", name: "Rybí koláček", weight: 8, luck: 70, triple: 30 },
  { id: "strawberry", emoji: "🍓", name: "Jahůdka", weight: 8, luck: 70, triple: 30 },
  { id: "peach", emoji: "🍑", name: "Broskvička", weight: 8, luck: 70, triple: 30 },
  { id: "cherry", emoji: "🍒", name: "Třešničky", weight: 8, luck: 70, triple: 30 },
];

/** Two matching symbols anywhere on the payline pay this multiplier. */
export const PAIR_MULTIPLIER = 5;
/** Two pandas pay extra. */
export const PANDA_PAIR_MULTIPLIER = 25;
/** Each panda on the payline (when not part of a better combo) pays this. */
export const SINGLE_PANDA_MULTIPLIER = 2;

export const START_BALANCE = 10_000;
export const MIN_BET = 10;
export const MAX_BET = 10_000;
export const LOAN_AMOUNTS = [500, 1_000, 2_500, 5_000, 10_000, 20_000] as const;

/**
 * Balanced odds. Each spin first draws an outcome with these chances, then the
 * reels are built to show it (like the virtual reels of a real machine).
 * Tuned for: a win about every 3.8 spins, x20+ about 1 in 111, three of a kind
 * 1 in 200, three pandas about 1 in 41 000 and an average return of ~0.965x.
 */
export const OUTCOME_CHANCE = {
  triple: 0.005,
  pandaPair: 0.004,
  pair: 0.028,
  singlePanda: 0.228,
} as const;

const TOTAL_LUCK = SYMBOLS.reduce((s, x) => s + x.luck, 0);

export type Rng = () => number; // returns [0, 1)

export function secureRandom(): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return (buf[0] ?? 0) / 2 ** 32;
  }
  return Math.random();
}

function pickWeighted(rng: Rng, list: SymbolDef[], weightOf: (s: SymbolDef) => number): SymbolDef {
  const total = list.reduce((t, s) => t + weightOf(s), 0);
  let r = rng() * total;
  for (const s of list) {
    r -= weightOf(s);
    if (r < 0) return s;
  }
  return list[list.length - 1]!;
}

export function randomSymbol(rng: Rng = secureRandom): SymbolDef {
  return pickWeighted(rng, SYMBOLS, (s) => s.weight);
}

export type WinKind = "none" | "single-panda" | "pair" | "triple";
export type WinTier = "none" | "small" | "big" | "mega" | "jackpot";

export type SpinResult = {
  kind: WinKind;
  multiplier: number;
  /** Indexes (0..2) of reels that form the win. */
  winningReels: number[];
  symbol?: SymbolDef;
};

export type Line = readonly [SymbolDef, SymbolDef, SymbolDef];

export function evaluate(line: Line): SpinResult {
  const [a, b, c] = line;
  if (a.id === b.id && b.id === c.id) {
    return { kind: "triple", multiplier: a.triple, winningReels: [0, 1, 2], symbol: a };
  }
  const pairs: [0 | 1 | 2, 0 | 1 | 2][] = [
    [0, 1],
    [1, 2],
    [0, 2],
  ];
  for (const [i, j] of pairs) {
    if (line[i].id === line[j].id) {
      const isPanda = line[i].id === "panda";
      return {
        kind: "pair",
        multiplier: isPanda ? PANDA_PAIR_MULTIPLIER : PAIR_MULTIPLIER,
        winningReels: [i, j],
        symbol: line[i],
      };
    }
  }
  const pandaIdx = [0, 1, 2].filter((i) => line[i as 0 | 1 | 2].id === "panda");
  const firstPanda = line.find((s) => s.id === "panda");
  if (firstPanda) {
    return {
      kind: "single-panda",
      multiplier: SINGLE_PANDA_MULTIPLIER,
      winningReels: pandaIdx,
      symbol: firstPanda,
    };
  }
  return { kind: "none", multiplier: 0, winningReels: [] };
}

const PANDA = SYMBOLS.find((s) => s.id === "panda")!;
const NON_PANDA = SYMBOLS.filter((s) => s.id !== "panda");

/** Weighted pick of a non-panda symbol not in `used`. */
function pickOther(rng: Rng, used: SymbolDef[]): SymbolDef {
  return pickWeighted(
    rng,
    NON_PANDA.filter((s) => !used.includes(s)),
    (s) => s.weight,
  );
}

/** Place `odd` at a random slot among two copies of `pairSym`. */
function withOdd(rng: Rng, pairSym: SymbolDef, odd: SymbolDef): Line {
  const line: [SymbolDef, SymbolDef, SymbolDef] = [pairSym, pairSym, pairSym];
  line[Math.min(2, Math.floor(rng() * 3))] = odd;
  return line;
}

export function spinLine(rng: Rng = secureRandom): Line {
  const c = OUTCOME_CHANCE;
  let r = rng();
  if ((r -= c.triple) < 0) {
    const s = pickWeighted(rng, SYMBOLS, (x) => x.luck);
    return [s, s, s];
  }
  if ((r -= c.pandaPair) < 0) return withOdd(rng, PANDA, pickOther(rng, []));
  if ((r -= c.pair) < 0) {
    const s = pickOther(rng, []);
    return withOdd(rng, s, pickOther(rng, [s]));
  }
  if ((r -= c.singlePanda) < 0) {
    const a = pickOther(rng, []);
    const b = pickOther(rng, [a]);
    const slot = Math.min(2, Math.floor(rng() * 3));
    if (slot === 0) return [PANDA, b, a];
    if (slot === 1) return [a, PANDA, b];
    return [a, b, PANDA];
  }
  // No win: three different non-panda symbols.
  const a = pickOther(rng, []);
  const b = pickOther(rng, [a]);
  return [a, b, pickOther(rng, [a, b])];
}

export function winTier(multiplier: number, _symbolId?: string): WinTier {
  if (multiplier <= 0) return "none";
  if (multiplier >= 250) return "jackpot";
  if (multiplier >= 80) return "mega";
  if (multiplier >= 20) return "big";
  return "small";
}

/** Wins of this many Pandí penízky (or more) get the special panda celebration. */
export const PANDA_WIN_THRESHOLD = 10_000;

export type CelebrationKind = WinTier | "panda";

/**
 * Which celebration a win gets. Jackpots keep their own screen; any other win
 * of PANDA_WIN_THRESHOLD or more gets the panda celebration.
 */
export function celebrationFor(win: number, multiplier: number): CelebrationKind {
  const tier = winTier(multiplier);
  if (tier === "none" || tier === "jackpot") return tier;
  if (win >= PANDA_WIN_THRESHOLD) return "panda";
  return tier;
}

export function clampBet(bet: number): number {
  if (!Number.isFinite(bet)) return MIN_BET;
  return Math.min(MAX_BET, Math.max(MIN_BET, Math.round(bet)));
}

/** MAX BET: the highest allowed bet the balance can cover (never below MIN_BET). */
export function maxAffordableBet(balance: number): number {
  return clampBet(Math.min(MAX_BET, Math.floor(balance)));
}

export function canSpin(balance: number, bet: number): boolean {
  return bet >= MIN_BET && bet <= MAX_BET && balance >= bet;
}

/** Payout for a spin: bet × multiplier, with no upper limit. */
export function payout(bet: number, multiplier: number): number {
  return Math.floor(bet * multiplier);
}

/** Winnings repay Bubbletea's debt first; the rest goes to the balance. */
export function applyWin(balance: number, debt: number, win: number) {
  const repaid = Math.min(debt, win);
  return { balance: balance + (win - repaid), debt: debt - repaid, repaid };
}

export function applyLoan(balance: number, debt: number, amount: number) {
  return { balance: balance + amount, debt: debt + amount };
}

/** Exact odds of the spin model above, for tuning and tests. */
export function theoreticalOdds() {
  const c = OUTCOME_CHANCE;
  const tripleEv = SYMBOLS.reduce((t, s) => t + (s.luck / TOTAL_LUCK) * s.triple, 0);
  return {
    rtp:
      c.triple * tripleEv +
      c.pandaPair * PANDA_PAIR_MULTIPLIER +
      c.pair * PAIR_MULTIPLIER +
      c.singlePanda * SINGLE_PANDA_MULTIPLIER,
    hitRate: c.triple + c.pandaPair + c.pair + c.singlePanda,
    /** x20 or more: panda pairs and every triple. */
    bigWinRate: c.pandaPair + c.triple,
    tripleRate: c.triple,
    pandaJackpot: (c.triple * PANDA.luck) / TOTAL_LUCK,
  };
}

/** Average share of the bet paid back per spin. */
export function theoreticalRtp(): number {
  return theoreticalOdds().rtp;
}
