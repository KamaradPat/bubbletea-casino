import { SYMBOLS, type SymbolDef } from "@/lib/slot";
import { cn } from "@/lib/utils";

/**
 * Slot symbol drawn from a bundled SVG (Twemoji artwork) instead of a system
 * emoji, so it looks the same on every device and never shows an empty box.
 */
export function SymbolIcon({ symbol, className, decorative }: { symbol: SymbolDef; className?: string; decorative?: boolean }) {
  return (
    <img
      src={`/symbols/${symbol.id}.svg`}
      alt={decorative ? "" : symbol.name}
      aria-hidden={decorative || undefined}
      draggable={false}
      className={cn("pointer-events-none select-none", className)}
    />
  );
}

/** Maps a stored emoji string (e.g. recent wins) back to symbol definitions. */
export function symbolsFromEmojis(emojis: string): SymbolDef[] {
  return Array.from(emojis)
    .map((ch) => SYMBOLS.find((s) => s.emoji === ch))
    .filter((s): s is SymbolDef => Boolean(s));
}
