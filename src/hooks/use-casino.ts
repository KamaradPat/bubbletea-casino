import { useCallback, useEffect, useRef, useState } from "react";
import {
  borrow as borrowFn,
  initialCasinoState,
  parseSaved,
  placeBet as placeBetFn,
  settleWin,
  withBet,
  type CasinoState,
} from "@/lib/casino-state";

const KEY = "bubbletea-panda-casino-v1";

export function useCasino() {
  const [state, setState] = useState<CasinoState>(initialCasinoState);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(state);
  ref.current = state;

  useEffect(() => {
    const saved = parseSaved(window.localStorage.getItem(KEY));
    if (saved) setState(saved);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, loaded]);

  const commit = (next: CasinoState) => {
    ref.current = next;
    setState(next);
  };

  const placeBet = useCallback((): boolean => {
    const next = placeBetFn(ref.current);
    if (!next) return false;
    commit(next);
    return true;
  }, []);

  const settle = useCallback((win: number, info: { multiplier: number; emojis: string; id: number }) => {
    const r = settleWin(ref.current, win, info);
    commit(r.state);
    return r.repaid;
  }, []);

  const borrow = useCallback((amount: number) => commit(borrowFn(ref.current, amount)), []);
  const setBet = useCallback((bet: number) => commit(withBet(ref.current, bet)), []);
  const newGame = useCallback(() => commit(initialCasinoState()), []);

  return { state, placeBet, settle, borrow, setBet, newGame };
}
