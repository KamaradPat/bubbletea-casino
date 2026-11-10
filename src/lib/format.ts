const nf = new Intl.NumberFormat("cs-CZ");

export function formatCoins(n: number): string {
  return nf.format(Math.round(n));
}
