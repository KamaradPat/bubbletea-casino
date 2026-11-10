/** A shiny golden coin with Bubbletea's panda face. */
export function PandaCoin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="33" r="30" fill="var(--coin-deep)" />
      <circle cx="32" cy="30" r="28" fill="var(--coin)" />
      <circle
        cx="32"
        cy="30"
        r="23"
        fill="none"
        stroke="var(--coin-deep)"
        strokeWidth="2"
        strokeDasharray="3 3"
        opacity="0.55"
      />
      <circle cx="21.5" cy="19.5" r="6" fill="var(--panda-ink)" />
      <circle cx="42.5" cy="19.5" r="6" fill="var(--panda-ink)" />
      <ellipse cx="32" cy="31" rx="15.5" ry="13.5" fill="var(--panda-white)" />
      <ellipse cx="26" cy="30.5" rx="4.2" ry="5.4" transform="rotate(25 26 30.5)" fill="var(--panda-patch)" />
      <ellipse cx="38" cy="30.5" rx="4.2" ry="5.4" transform="rotate(-25 38 30.5)" fill="var(--panda-patch)" />
      <circle cx="26.6" cy="30" r="1.9" fill="var(--panda-white)" />
      <circle cx="37.4" cy="30" r="1.9" fill="var(--panda-white)" />
      <ellipse cx="32" cy="36.4" rx="2.1" ry="1.5" fill="var(--panda-ink)" />
      <ellipse cx="22.8" cy="37" rx="2.6" ry="1.5" fill="var(--panda-cheek)" />
      <ellipse cx="41.2" cy="37" rx="2.6" ry="1.5" fill="var(--panda-cheek)" />
      <path
        d="M12 22 A 21 21 0 0 1 28 7"
        stroke="var(--coin-shine)"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
    </svg>
  );
}

/** A tiny panda head, used as celebration confetti. */
export function PandaFace({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="15" cy="16" r="10" fill="var(--panda-ink)" />
      <circle cx="49" cy="16" r="10" fill="var(--panda-ink)" />
      <ellipse cx="32" cy="35" rx="25" ry="22" fill="var(--panda-white)" stroke="var(--panda-ink)" strokeWidth="2" />
      <ellipse cx="23" cy="33" rx="6" ry="7.5" transform="rotate(25 23 33)" fill="var(--panda-patch)" />
      <ellipse cx="41" cy="33" rx="6" ry="7.5" transform="rotate(-25 41 33)" fill="var(--panda-patch)" />
      <circle cx="24" cy="32" r="2.4" fill="var(--panda-white)" />
      <circle cx="40" cy="32" r="2.4" fill="var(--panda-white)" />
      <ellipse cx="32" cy="41" rx="3" ry="2.1" fill="var(--panda-ink)" />
      <ellipse cx="17" cy="42" rx="3.6" ry="2.2" fill="var(--panda-cheek)" />
      <ellipse cx="47" cy="42" rx="3.6" ry="2.2" fill="var(--panda-cheek)" />
    </svg>
  );
}
