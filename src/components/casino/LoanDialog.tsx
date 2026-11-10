import { useState } from "react";
import { LOAN_AMOUNTS } from "@/lib/slot";
import { formatCoins } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Bubbletea } from "./Bubbletea";
import { Modal } from "./Modal";

type Props = {
  open: boolean;
  debt: number;
  onClose: () => void;
  onBorrow: (amount: number) => void;
  onPick: () => void;
};

export function LoanDialog({ open, debt, onClose, onBorrow, onPick }: Props) {
  const [amount, setAmount] = useState<number>(LOAN_AMOUNTS[1]);

  return (
    <Modal open={open} onClose={onClose} labelledBy="loan-title">
      <div className="flex items-start gap-3">
        <Bubbletea className="w-24 shrink-0" mood="happy" />
        <div className="relative rounded-3xl rounded-tl-md bg-muted p-3">
          <p id="loan-title" className="font-display text-lg font-bold leading-snug">
            Ahoj, mimi! Chceš si půjčit nějaké Pandí penízky? Ráda ti pomůžu!
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm font-semibold text-muted-foreground">Kolik si chceš půjčit?</p>
      <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Částka půjčky">
        {LOAN_AMOUNTS.map((a) => (
          <button
            key={a}
            type="button"
            role="radio"
            aria-checked={amount === a}
            onClick={() => {
              setAmount(a);
              onPick();
            }}
            className={cn(
              "rounded-2xl border-[3px] px-2 py-2.5 font-display text-base font-bold transition-all",
              amount === a
                ? "border-primary-deep bg-primary-deep text-primary-foreground shadow-[var(--glow-pink)] scale-105"
                : "border-border bg-cream hover:border-primary",
            )}
          >
            {formatCoins(a)}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-secondary/60 p-3 text-sm text-secondary-foreground">
        Dluh u Bubbletea po půjčce: <b>{formatCoins(debt + amount)}</b>
        <br />
        <span className="opacity-80">Výhry nejdřív automaticky splácí dluh.</span>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-2xl border-[3px] border-border bg-card py-3 font-display font-bold"
        >
          Teď ne
        </button>
        <button
          type="button"
          onClick={() => onBorrow(amount)}
          className="btn-pop flex-[1.4] rounded-2xl bg-[image:var(--gradient-spin)] py-3 font-display text-lg font-extrabold text-primary-foreground"
        >
          Půjčit si
        </button>
      </div>
    </Modal>
  );
}
