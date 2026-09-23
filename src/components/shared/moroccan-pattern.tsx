// ===================================================================
//  MoroccanPattern — أنماط زخرفية مغربية SVG
//  - variant: "zellige" (بلاط) | "arabesque" (أرابيسك) | "stars" (نجوم)
//  - className: أصناف Tailwind إضافية
//  - opacity: مستوى الشفافية (0-1)
//
//  الاستعمال كخلفية زخرفية:
//    <div className="relative ...">
//      <MoroccanPattern variant="zellige" opacity={0.08} className="absolute inset-0" />
//      <div className="relative z-10">محتوى فوق النمط</div>
//    </div>
//
//  الاستعمال كقطعة منفصلة:
//    <MoroccanPattern variant="arabesque" className="h-12 w-full" />
// ===================================================================

import * as React from "react";
import { cn } from "@/lib/utils";

export type MoroccanPatternVariant = "zellige" | "arabesque" | "stars";

interface MoroccanPatternProps {
  variant?: MoroccanPatternVariant;
  className?: string;
  opacity?: number;
  /** اللون الأساسي للنمط — افتراضياً يأخذ من var(--primary) */
  color?: string;
  /** اللون الثانوي للنمط — افتراضياً var(--copper) */
  secondaryColor?: string;
}

// ─────────── نمط البلاط الزليج ───────────
// شبكة من النجوم الثمانية والنجوم الأربعة، متكرّرة كل 64×64
const ZelligePattern: React.FC<{ color: string; secondary: string }> = ({
  color,
  secondary,
}) => (
  <g>
    <defs>
      <pattern
        id="zellige-tile"
        x="0"
        y="0"
        width="64"
        height="64"
        patternUnits="userSpaceOnUse"
      >
        {/* مربّع خلفية */}
        <rect width="64" height="64" fill="none" />
        {/* نجمة ثمانية مركزية */}
        <path
          d="M32 8 L40 16 L48 12 L44 22 L52 24 L44 28 L48 38 L40 36 L32 44 L24 36 L16 38 L20 28 L12 24 L20 22 L16 12 L24 16 Z"
          fill={color}
          opacity="0.7"
        />
        {/* نقطة ذهبية في المركز */}
        <circle cx="32" cy="24" r="3" fill={secondary} />
        {/* نجوم أربعة في الأركان */}
        <path
          d="M4 4 L6 8 L10 6 L8 10 L12 12 L8 14 L10 18 L6 16 L4 20 L2 16 L0 18 L2 14 L0 12 L4 10 L2 6 L6 8 Z"
          fill={secondary}
          opacity="0.5"
          transform="translate(0,0)"
        />
        <path
          d="M60 4 L62 8 L60 12 L58 8 Z M58 0 L62 4 L58 8 L54 4 Z"
          fill={secondary}
          opacity="0.4"
        />
        {/* معينات صغيرة على الحواف */}
        <path
          d="M32 48 L34 52 L32 56 L30 52 Z"
          fill={color}
          opacity="0.6"
        />
        <path
          d="M48 48 L52 50 L48 52 L46 50 Z M16 48 L20 50 L16 52 L14 50 Z"
          fill={secondary}
          opacity="0.5"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#zellige-tile)" />
  </g>
);

// ─────────── نمط الأرابيسك ───────────
// خطوط منحنية متماثلة على طريقة الزخرفة الإسلامية
const ArabesquePattern: React.FC<{ color: string; secondary: string }> = ({
  color,
  secondary,
}) => (
  <g>
    <defs>
      <pattern
        id="arabesque-tile"
        x="0"
        y="0"
        width="80"
        height="80"
        patternUnits="userSpaceOnUse"
      >
        {/* منحنيات متماثلة */}
        <path
          d="M0 40 Q 20 0 40 40 Q 60 80 80 40"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
          opacity="0.7"
        />
        <path
          d="M0 40 Q 20 80 40 40 Q 60 0 80 40"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
          opacity="0.5"
        />
        {/* دوائر متّصلة */}
        <circle cx="40" cy="40" r="6" fill="none" stroke={secondary} strokeWidth="1" opacity="0.6" />
        <circle cx="40" cy="40" r="2" fill={secondary} opacity="0.8" />
        <circle cx="0" cy="0" r="3" fill={color} opacity="0.4" />
        <circle cx="80" cy="0" r="3" fill={color} opacity="0.4" />
        <circle cx="0" cy="80" r="3" fill={color} opacity="0.4" />
        <circle cx="80" cy="80" r="3" fill={color} opacity="0.4" />
        {/* معينات */}
        <path
          d="M40 30 L42 40 L40 50 L38 40 Z"
          fill={secondary}
          opacity="0.6"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#arabesque-tile)" />
  </g>
);

// ─────────── نمط النجوم ───────────
// نجوم ثمانية صغيرة مبعثرة
const StarsPattern: React.FC<{ color: string; secondary: string }> = ({
  color,
  secondary,
}) => (
  <g>
    <defs>
      <pattern
        id="stars-tile"
        x="0"
        y="0"
        width="48"
        height="48"
        patternUnits="userSpaceOnUse"
      >
        {/* نجمة كبيرة */}
        <path
          d="M24 6 L27 16 L36 12 L32 21 L42 24 L32 27 L36 36 L27 32 L24 42 L21 32 L12 36 L16 27 L6 24 L16 21 L12 12 L21 16 Z"
          fill={color}
          opacity="0.65"
        />
        {/* نقطة ذهبية مركزية */}
        <circle cx="24" cy="24" r="2.5" fill={secondary} opacity="0.9" />
        {/* نجوم صغيرة في الأركان */}
        <path
          d="M0 0 L1.5 3 L4 4 L1.5 5 L0 8 L-1.5 5 L-4 4 L-1.5 3 Z"
          fill={secondary}
          opacity="0.5"
          transform="translate(8,8)"
        />
        <path
          d="M0 0 L1.5 3 L4 4 L1.5 5 L0 8 L-1.5 5 L-4 4 L-1.5 3 Z"
          fill={secondary}
          opacity="0.5"
          transform="translate(40,8)"
        />
        <path
          d="M0 0 L1.5 3 L4 4 L1.5 5 L0 8 L-1.5 5 L-4 4 L-1.5 3 Z"
          fill={secondary}
          opacity="0.5"
          transform="translate(8,40)"
        />
        <path
          d="M0 0 L1.5 3 L4 4 L1.5 5 L0 8 L-1.5 5 L-4 4 L-1.5 3 Z"
          fill={secondary}
          opacity="0.5"
          transform="translate(40,40)"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#stars-tile)" />
  </g>
);

const VARIANTS: Record<
  MoroccanPatternVariant,
  React.FC<{ color: string; secondary: string }>
> = {
  zellige: ZelligePattern,
  arabesque: ArabesquePattern,
  stars: StarsPattern,
};

/**
 * مكوّن MoroccanPattern — يُولّد نمطاً زخرفياً مغربياً قابلاً للتجانب.
 * مثالي للخلفيات والزخارف الجانبية.
 */
export function MoroccanPattern({
  variant = "zellige",
  className,
  opacity = 0.08,
  color = "var(--primary)",
  secondaryColor = "var(--copper)",
}: MoroccanPatternProps) {
  const Pattern = VARIANTS[variant];
  return (
    <svg
      className={cn("pointer-events-none", className)}
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      style={{ opacity }}
      aria-hidden="true"
      focusable="false"
    >
      <Pattern color={color} secondary={secondaryColor} />
    </svg>
  );
}

export default MoroccanPattern;
