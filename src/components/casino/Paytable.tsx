import { Gift } from "lucide-react";
import { PAIR_MULTIPLIER, PANDA_PAIR_MULTIPLIER, SINGLE_PANDA_MULTIPLIER, SYMBOLS } from "@/lib/slot";
import { SymbolIcon } from "./SymbolIcon";

const panda = SYMBOLS.find((s) => s.id === "panda")!;

export function Paytable() {
  const sorted = [...SYMBOLS].sort((a, b) => b.triple - a.triple);
  return (
    <section className="kawaii-card p-4 sm:p-5" aria-labelledby="paytable-title">
      <h2 id="paytable-title" className="flex items-center gap-2 font-display text-xl font-extrabold">
        <Gift className="size-5 text-primary-deep" aria-hidden />
        Výherní tabulka
      </h2>
      <p className="text-xs text-muted-foreground">Násobek sázky na výherní lince</p>

      <ul className="mt-3 grid grid-cols-2 gap-1.5 text-sm">
        {sorted.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between rounded-xl bg-muted/70 px-2.5 py-1.5"
            title={s.name}
          >
            <span className="flex gap-0.5" aria-label={`3× ${s.name}`}>
              {[0, 1, 2].map((i) => (
                <SymbolIcon key={i} symbol={s} decorative className="size-5" />
              ))}
            </span>
            <b className="font-display text-primary-deep">×{s.triple}</b>
          </li>
        ))}
      </ul>

      <ul className="mt-3 space-y-1.5 text-sm">
        <li className="flex items-center justify-between rounded-xl bg-secondary/70 px-3 py-1.5 text-secondary-foreground">
          <span className="flex items-center gap-1">
            <SymbolIcon symbol={panda} decorative className="size-5" />
            <SymbolIcon symbol={panda} decorative className="size-5" />
            <span className="ml-1">Dvě pandy</span>
          </span>
          <b className="font-display">×{PANDA_PAIR_MULTIPLIER}</b>
        </li>
        <li className="flex items-center justify-between rounded-xl bg-secondary/70 px-3 py-1.5 text-secondary-foreground">
          <span>Libovolné dva stejné symboly</span>
          <b className="font-display">×{PAIR_MULTIPLIER}</b>
        </li>
        <li className="flex items-center justify-between rounded-xl bg-secondary/70 px-3 py-1.5 text-secondary-foreground">
          <span className="flex items-center gap-1">
            <SymbolIcon symbol={panda} decorative className="size-5" />
            <span className="ml-1">Jedna panda kdekoliv</span>
          </span>
          <b className="font-display">×{SINGLE_PANDA_MULTIPLIER}</b>
        </li>
      </ul>
    </section>
  );
}
