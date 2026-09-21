import { cn } from "@/lib/utils";

interface ZelligeDividerProps {
  className?: string;
  variant?: "diamond" | "wave" | "stars" | "minimal";
  color?: string;
}

/**
 * فاصل زخرفي مغربي (Zellige Divider) — مكوّن SVG قابل لإعادة الاستخدام
 * مستوحى من نقوش الزليج المغربي
 */
export function ZelligeDivider({
  className,
  variant = "diamond",
  color = "currentColor",
}: ZelligeDividerProps) {
  const patterns: Record<
    NonNullable<ZelligeDividerProps["variant"]>,
    React.ReactNode
  > = {
    diamond: (
      <g fill={color}>
        <path
          d="M0 12 L8 4 L16 12 L8 20 Z M16 12 L24 4 L32 12 L24 20 Z M32 12 L40 4 L48 12 L40 20 Z M48 12 L56 4 L64 12 L56 20 Z M64 12 L72 4 L80 12 L72 20 Z M80 12 L88 4 L96 12 L88 20 Z M96 12 L104 4 L112 12 L104 20 Z M112 12 L120 4 L128 12 L120 20 Z"
          opacity="0.7"
        />
        <circle cx="8" cy="12" r="1.5" fill="var(--copper, #C8842A)" />
        <circle cx="24" cy="12" r="1.5" fill="var(--copper, #C8842A)" />
        <circle cx="40" cy="12" r="1.5" fill="var(--copper, #C8842A)" />
        <circle cx="56" cy="12" r="1.5" fill="var(--copper, #C8842A)" />
        <circle cx="72" cy="12" r="1.5" fill="var(--copper, #C8842A)" />
        <circle cx="88" cy="12" r="1.5" fill="var(--copper, #C8842A)" />
        <circle cx="104" cy="12" r="1.5" fill="var(--copper, #C8842A)" />
        <circle cx="120" cy="12" r="1.5" fill="var(--copper, #C8842A)" />
      </g>
    ),
    wave: (
      <g fill="none" stroke={color} strokeWidth="1.5" opacity="0.6">
        <path d="M0 12 Q 8 4, 16 12 T 32 12 T 48 12 T 64 12 T 80 12 T 96 12 T 112 12 T 128 12" />
        <path
          d="M0 16 Q 8 24, 16 16 T 32 16 T 48 16 T 64 16 T 80 16 T 96 16 T 112 16 T 128 16"
          opacity="0.5"
        />
      </g>
    ),
    stars: (
      <g fill={color}>
        {Array.from({ length: 8 }).map((_, i) => (
          <path
            key={i}
            d={`M${8 + i * 16} 12 l1.5 3 3 1.5 -3 1.5 -1.5 3 -1.5 -3 -3 -1.5 3 -1.5 z`}
            opacity="0.7"
          />
        ))}
      </g>
    ),
    minimal: (
      <g stroke={color} strokeWidth="1" opacity="0.4">
        <line x1="0" y1="12" x2="48" y2="12" />
        <circle
          cx="56"
          cy="12"
          r="2"
          fill="var(--copper, #C8842A)"
          stroke="none"
        />
        <line x1="64" y1="12" x2="112" y2="12" />
      </g>
    ),
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center w-full text-primary",
        className
      )}
      role="presentation"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 128 24"
        preserveAspectRatio="xMidYMid meet"
        className="w-full max-w-md h-6"
        xmlns="http://www.w3.org/2000/svg"
      >
        {patterns[variant]}
      </svg>
    </div>
  );
}
