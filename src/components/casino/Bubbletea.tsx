import { cn } from "@/lib/utils";

export type BubbleteaMood = "idle" | "happy";

type Props = {
  className?: string;
  mood?: BubbleteaMood;
  /** Changing this number replays the hop animation. */
  hopKey?: number;
  bounceLoop?: boolean;
  onClick?: () => void;
  label?: string;
};

/** Bubbletea — a panda sitting in a green bubble tea cup with bamboo leaves. */
export function Bubbletea({ className, mood = "idle", hopKey = 0, bounceLoop, onClick, label }: Props) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={label}
      className={cn(
        "relative block select-none outline-none focus-visible:ring-4 focus-visible:ring-ring rounded-full",
        onClick && "cursor-pointer transition-transform hover:scale-105 active:scale-95",
        className,
      )}
    >
      <div className={cn(!bounceLoop && "animate-bob")}>
        <div key={hopKey} className={cn(bounceLoop ? "animate-hop-loop" : hopKey > 0 && "animate-hop")}>
          <svg viewBox="0 0 200 232" className="h-auto w-full drop-shadow-[0_10px_14px_oklch(0.6_0.12_350/0.35)]">
            {/* bamboo leaves behind the cup */}
            <g className="animate-leaf">
              <path d="M40 142 C 8 124, 2 96, 10 78 C 30 90, 44 112, 40 142 Z" fill="var(--leaf)" />
              <path d="M40 142 C 28 120, 18 100, 10 78" stroke="var(--leaf-deep)" strokeWidth="2" fill="none" />
              <path d="M44 142 C 26 136, 12 128, 4 112 C 20 110, 36 122, 44 142 Z" fill="var(--leaf-deep)" />
            </g>
            <g className="animate-leaf" style={{ animationDelay: "-1.3s" }}>
              <path d="M160 142 C 192 124, 198 96, 190 78 C 170 90, 156 112, 160 142 Z" fill="var(--leaf)" />
              <path d="M160 142 C 172 120, 182 100, 190 78" stroke="var(--leaf-deep)" strokeWidth="2" fill="none" />
            </g>

            {/* straw */}
            <g transform="rotate(16 136 90)">
              <rect x="130" y="14" width="13" height="136" rx="6.5" fill="var(--straw)" />
              <rect x="133" y="20" width="3" height="120" rx="1.5" fill="var(--cup-shine)" opacity="0.6" />
            </g>

            {/* ears */}
            <circle cx="58" cy="54" r="20" fill="var(--panda-ink)" />
            <circle cx="142" cy="54" r="20" fill="var(--panda-ink)" />
            <circle cx="58" cy="54" r="9" fill="var(--panda-cheek)" opacity="0.55" />
            <circle cx="142" cy="54" r="9" fill="var(--panda-cheek)" opacity="0.55" />

            {/* head */}
            <ellipse cx="100" cy="98" rx="57" ry="51" fill="var(--panda-white)" stroke="var(--border)" strokeWidth="3" />

            {/* bamboo leaf hair clip */}
            <g className="animate-leaf" style={{ animationDelay: "-0.6s" }}>
              <path d="M104 52 C 110 32, 128 24, 142 26 C 136 42, 122 52, 104 52 Z" fill="var(--leaf)" />
              <path d="M104 52 C 98 36, 86 30, 74 32 C 80 46, 92 52, 104 52 Z" fill="var(--leaf-deep)" />
              <circle cx="104" cy="51" r="4" fill="var(--straw)" />
            </g>

            {/* eye patches */}
            <ellipse cx="77" cy="99" rx="18" ry="22" transform="rotate(30 77 99)" fill="var(--panda-patch)" />
            <ellipse cx="123" cy="99" rx="18" ry="22" transform="rotate(-30 123 99)" fill="var(--panda-patch)" />

            {/* big shiny eyes (blinking) */}
            <g className="animate-blink">
              <circle cx="80" cy="101" r="12.5" fill="var(--panda-ink)" />
              <circle cx="75.5" cy="95.5" r="5" fill="var(--panda-white)" />
              <circle cx="85" cy="106" r="2.2" fill="var(--panda-white)" />
            </g>
            <g className="animate-blink">
              <circle cx="120" cy="101" r="12.5" fill="var(--panda-ink)" />
              <circle cx="115.5" cy="95.5" r="5" fill="var(--panda-white)" />
              <circle cx="125" cy="106" r="2.2" fill="var(--panda-white)" />
            </g>

            {/* cheeks */}
            <ellipse cx="62" cy="121" rx="10" ry="6" fill="var(--panda-cheek)" opacity="0.9" />
            <ellipse cx="138" cy="121" rx="10" ry="6" fill="var(--panda-cheek)" opacity="0.9" />

            {/* nose */}
            <ellipse cx="100" cy="114" rx="5.5" ry="4" fill="var(--panda-ink)" />
            <ellipse cx="98.4" cy="112.6" rx="1.7" ry="1" fill="var(--panda-white)" opacity="0.8" />

            {/* mouth + tiny tongue */}
            {mood === "happy" ? (
              <g>
                <path d="M90 119 Q100 136 110 119 Z" fill="var(--panda-ink)" />
                <ellipse cx="100" cy="128" rx="5.5" ry="3.8" fill="var(--panda-tongue)" />
              </g>
            ) : (
              <g>
                <path d="M96.5 120.5 Q100 129 103.5 120.5 Z" fill="var(--panda-tongue)" />
                <path
                  d="M92 119 Q96 124 100 119 Q104 124 108 119"
                  stroke="var(--panda-ink)"
                  strokeWidth="2.4"
                  fill="none"
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* cup */}
            <path
              d="M30 140 L170 140 L156 222 Q155 228 148 228 L52 228 Q45 228 44 222 Z"
              fill="var(--cup)"
              stroke="var(--cup-deep)"
              strokeWidth="3"
            />
            <rect x="48" y="154" width="8" height="56" rx="4" fill="var(--cup-shine)" opacity="0.75" />
            {/* tapioca pearls */}
            {([
              [66, 214],
              [82, 217],
              [98, 214],
              [114, 217],
              [130, 214],
              [74, 202],
              [92, 204],
              [110, 202],
              [126, 204],
            ] as const).map(([x, y]) => (
              <g key={`${x}-${y}`}>
                <circle cx={x} cy={y} r="6.5" fill="var(--pearl)" />
                <circle cx={x - 2} cy={y - 2} r="1.8" fill="var(--panda-white)" opacity="0.7" />
              </g>
            ))}
            {/* heart on the cup */}
            <path
              d="M100 186 C 86 176, 84 166, 92 162 C 96 160, 100 163, 100 167 C 100 163, 104 160, 108 162 C 116 166, 114 176, 100 186 Z"
              fill="var(--straw)"
            />
            {/* rim */}
            <rect x="22" y="131" width="156" height="16" rx="8" fill="var(--cup-deep)" />
            {/* paws on rim */}
            <ellipse cx="66" cy="135" rx="14" ry="10.5" fill="var(--panda-ink)" />
            <ellipse cx="134" cy="135" rx="14" ry="10.5" fill="var(--panda-ink)" />
            <circle cx="66" cy="137" r="3.4" fill="var(--panda-cheek)" />
            <circle cx="134" cy="137" r="3.4" fill="var(--panda-cheek)" />
          </svg>
        </div>
      </div>
    </Wrapper>
  );
}
