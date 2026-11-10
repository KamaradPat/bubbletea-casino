import { describe, expect, it } from "vitest";
import {
  LOAN_AMOUNTS,
  MAX_BET,
  MIN_BET,
  SYMBOLS,
  START_BALANCE,
  celebrationFor,
  clampBet,
  evaluate,
  maxAffordableBet,
  payout,
  spinLine,
  theoreticalOdds,
} from "@/lib/slot";
import { borrow, initialCasinoState, placeBet, settleWin, withBet } from "@/lib/casino-state";

const sym = (id: string) => SYMBOLS.find((s) => s.id === id)!;

describe("casino rules", () => {
  it("starts with 10 000 Panda Coins and no debt", () => {
    const s = initialCasinoState();
    expect(s.balance).toBe(10_000);
    expect(START_BALANCE).toBe(10_000);
    expect(s.debt).toBe(0);
  });

  it("bet is limited to 10 – 10 000", () => {
    expect(MIN_BET).toBe(10);
    expect(MAX_BET).toBe(10_000);
    expect(clampBet(5)).toBe(10);
    expect(clampBet(50_000)).toBe(10_000);
    expect(maxAffordableBet(3_456)).toBe(3_456);
    expect(maxAffordableBet(99_999)).toBe(10_000);
  });

  it("cannot spin without enough balance", () => {
    const s = { ...withBet(initialCasinoState(), 500), balance: 499 };
    expect(placeBet(s)).toBeNull();
    const ok = placeBet({ ...s, balance: 500 });
    expect(ok?.balance).toBe(0);
    expect(ok?.spins).toBe(1);
  });

  it("offers loans of 500, 1000, 2500, 5000, 10000 and 20000", () => {
    expect([...LOAN_AMOUNTS]).toEqual([500, 1_000, 2_500, 5_000, 10_000, 20_000]);
  });

  it("a loan adds to balance and to debt", () => {
    const s = borrow(initialCasinoState(), 2_500);
    expect(s.balance).toBe(12_500);
    expect(s.debt).toBe(2_500);
  });

  it("winnings repay the debt first", () => {
    const s = { ...initialCasinoState(), balance: 100, debt: 1_000 };
    const partial = settleWin(s, 600, { multiplier: 6, emojis: "", id: 1 });
    expect(partial.state.debt).toBe(400);
    expect(partial.state.balance).toBe(100);
    const full = settleWin(s, 1_500, { multiplier: 15, emojis: "", id: 2 });
    expect(full.state.debt).toBe(0);
    expect(full.state.balance).toBe(600);
  });

  it("three pandas pay the top multiplier", () => {
    const r = evaluate([sym("panda"), sym("panda"), sym("panda")]);
    expect(r.kind).toBe("triple");
    expect(r.multiplier).toBe(Math.max(...SYMBOLS.map((s) => s.triple)));
  });

  it("about 1 in 3 to 1 in 4 spins wins", () => {
    const { hitRate } = theoreticalOdds();
    expect(hitRate).toBeGreaterThanOrEqual(1 / 4);
    expect(hitRate).toBeLessThanOrEqual(1 / 3);
  });

  it("big wins (x20 or more) come about 1 in 100–120 spins", () => {
    const { bigWinRate } = theoreticalOdds();
    expect(bigWinRate).toBeGreaterThanOrEqual(1 / 120);
    expect(bigWinRate).toBeLessThanOrEqual(1 / 100);
  });

  it("three of a kind comes about 1 in 200 spins", () => {
    expect(theoreticalOdds().tripleRate).toBeCloseTo(1 / 200, 4);
  });

  it("three pandas come about 1 in 25 000 – 50 000 spins", () => {
    const { pandaJackpot } = theoreticalOdds();
    expect(pandaJackpot).toBeGreaterThanOrEqual(1 / 50_000);
    expect(pandaJackpot).toBeLessThanOrEqual(1 / 25_000);
  });

  it("average return per spin is 0.95x – 0.98x", () => {
    const { rtp } = theoreticalOdds();
    expect(rtp).toBeGreaterThanOrEqual(0.95);
    expect(rtp).toBeLessThanOrEqual(0.98);
  });

  it("the reels really show the drawn outcome", () => {
    const seq = (vals: number[]) => () => vals.shift() ?? 0.5;
    expect(evaluate(spinLine(seq([0.001]))).kind).toBe("triple");
    expect(evaluate(spinLine(seq([0.006]))).multiplier).toBe(25);
    expect(evaluate(spinLine(seq([0.02]))).kind).toBe("pair");
    expect(evaluate(spinLine(seq([0.1]))).kind).toBe("single-panda");
    expect(evaluate(spinLine(seq([0.9]))).kind).toBe("none");
  });

  it("wins of 10 000 or more get the panda celebration", () => {
    expect(celebrationFor(10_000, 5)).toBe("panda");
    expect(celebrationFor(50_000, 25)).toBe("panda");
  });

  it("wins under 10 000 keep their normal celebration", () => {
    expect(celebrationFor(9_999, 5)).toBe("small");
    expect(celebrationFor(2_500, 25)).toBe("big");
  });

  it("jackpots keep the jackpot screen even above 10 000", () => {
    expect(celebrationFor(200_000, 2000)).toBe("jackpot");
  });

  it("payouts are not capped: 3 pandas at a 10 000 bet pay 20 000 000", () => {
    const m = evaluate([sym("panda"), sym("panda"), sym("panda")]).multiplier;
    expect(payout(10_000, m)).toBe(20_000_000);
    expect(payout(100, m)).toBe(200_000);
  });

  it("a huge win lands fully in the balance", () => {
    const s = { ...initialCasinoState(), balance: 0, debt: 0 };
    const r = settleWin(s, 20_000_000, { multiplier: 2000, emojis: "", id: 1 });
    expect(r.state.balance).toBe(20_000_000);
    expect(r.state.biggestWin).toBe(20_000_000);
  });
});
