import { useEffect, useRef, useState } from "react";

/** Smoothly eases a displayed number towards `target` (ease-out cubic). */
export function useTweenNumber(target: number, ms = 800, from?: number) {
  const start = from ?? target;
  const [value, setValue] = useState(start);
  const current = useRef(start);

  useEffect(() => {
    const begin = current.current;
    if (begin === target) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      const v = p >= 1 ? target : begin + (target - begin) * (1 - Math.pow(1 - p, 3));
      current.current = v;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);

  return value;
}
