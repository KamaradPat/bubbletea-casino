import { BarChart3, Coins, CupSoda, Crown, RotateCw, Trophy, Wallet, type LucideIcon } from "lucide-react";
import type { CasinoState } from "@/lib/casino-state";
import { formatCoins } from "@/lib/format";
import { SymbolIcon, symbolsFromEmojis } from "./SymbolIcon";

export function Stats({ state }: { state: CasinoState }) {
  const rows: [LucideIcon, string, string][] = [
    [RotateCw, "Otočení", formatCoins(state.spins)],
    [Coins, "Vsazeno", formatCoins(state.totalBet)],
    [Trophy, "Vyhráno", formatCoins(state.totalWon)],
    [Crown, "Největší výhra", formatCoins(state.biggestWin)],
    [CupSoda, "Půjčeno celkem", formatCoins(state.borrowed)],
    [Wallet, "Zůstatek", formatCoins(state.balance)],
  ];
  return (
    <section className="kawaii-card p-4 sm:p-5" aria-labelledby="stats-title">
      <h2 id="stats-title" className="flex items-center gap-2 font-display text-xl font-extrabold">
        <BarChart3 className="size-5 text-secondary-deep" aria-hidden />
        Statistiky
      </h2>
      <dl className="mt-3 grid grid-cols-2 gap-2">
        {rows.map(([Icon, k, v]) => (
          <div key={k} className="rounded-2xl bg-muted/70 px-3 py-2">
            <dt className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <Icon className="size-3.5" aria-hidden />
              {k}
            </dt>
            <dd className="font-display text-lg font-extrabold leading-tight">{v}</dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-4 font-display text-base font-bold">Poslední výhry</h3>
      {state.recent.length === 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">Zatím žádné výhry. Bubbletea ti drží tlapky!</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {state.recent.map((w) => (
            <li
              key={w.id}
              className="animate-pop-in flex items-center justify-between gap-2 rounded-xl bg-cream px-3 py-1.5 text-sm"
            >
              <span className="flex gap-0.5">
                {symbolsFromEmojis(w.emojis).map((s, i) => (
                  <SymbolIcon key={i} symbol={s} className="size-5" />
                ))}
              </span>
              <span className="text-xs font-bold text-muted-foreground">×{w.multiplier}</span>
              <span className="ml-auto font-display font-extrabold text-secondary-deep">
                +{formatCoins(w.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
