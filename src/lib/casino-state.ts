import { START_BALANCE, applyLoan, applyWin, canSpin, clampBet } from "./slot";

export type RecentWin = {
  id: number;
  amount: number;
  multiplier: number;
  emojis: string;
  repaid: number;
};

export type CasinoState = {
  balance: number;
  debt: number;
  bet: number;
  spins: number;
  totalBet: number;
  totalWon: number;
  biggestWin: number;
  borrowed: number;
  recent: RecentWin[];
};

export const DEFAULT_BET = 100;

export function initialCasinoState(): CasinoState {
  return {
    balance: START_BALANCE,
    debt: 0,
    bet: DEFAULT_BET,
    spins: 0,
    totalBet: 0,
    totalWon: 0,
    biggestWin: 0,
    borrowed: 0,
    recent: [],
  };
}

/** Takes the bet from the balance; returns null when the balance can't cover it. */
export function placeBet(s: CasinoState): CasinoState | null {
  if (!canSpin(s.balance, s.bet)) return null;
  return { ...s, balance: s.balance - s.bet, spins: s.spins + 1, totalBet: s.totalBet + s.bet };
}

export function settleWin(
  s: CasinoState,
  win: number,
  info: { multiplier: number; emojis: string; id: number },
): { state: CasinoState; repaid: number } {
  if (win <= 0) return { state: s, repaid: 0 };
  const r = applyWin(s.balance, s.debt, win);
  return {
    repaid: r.repaid,
    state: {
      ...s,
      balance: r.balance,
      debt: r.debt,
      totalWon: s.totalWon + win,
      biggestWin: Math.max(s.biggestWin, win),
      recent: [{ id: info.id, amount: win, multiplier: info.multiplier, emojis: info.emojis, repaid: r.repaid }, ...s.recent].slice(0, 8),
    },
  };
}

export function borrow(s: CasinoState, amount: number): CasinoState {
  const r = applyLoan(s.balance, s.debt, amount);
  return { ...s, ...r, borrowed: s.borrowed + amount };
}

export function withBet(s: CasinoState, bet: number): CasinoState {
  return { ...s, bet: clampBet(bet) };
}

export function parseSaved(raw: string | null): CasinoState | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<CasinoState>;
    const base = initialCasinoState();
    const merged = { ...base, ...v };
    if (typeof merged.balance !== "number" || typeof merged.debt !== "number") return null;
    merged.bet = clampBet(merged.bet);
    merged.recent = Array.isArray(merged.recent) ? merged.recent.slice(0, 8) : [];
    return merged;
  } catch {
    return null;
  }
}
