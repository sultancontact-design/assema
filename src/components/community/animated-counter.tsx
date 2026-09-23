"use client";

// ===================================================================
//  AnimatedCounter — عدّاد رقمي متحرّك
//  - يبدأ من 0 ويرتفع حتى القيمة الهدف عبر requestAnimationFrame
//  - Easing: easeOutExpo (يبدأ سريعاً ثم يتباطأ)
//  - IntersectionObserver: ينطلق عند دخول العنصر إلى الـviewport
//  - تنسيق أرقام عربي مع فواصل الآلاف
// ===================================================================

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface AnimatedCounterProps {
  /** القيمة الهدف */
  value: number;
  /** المدة الإجمالية بالميلي ثانية (افتراضي 2000) */
  duration?: number;
  /** دالة تنسيق اختيارية (مثل إضافة "د.م" أو رمز خاص) */
  formatFn?: (n: number) => string;
  /** أصناف إضافية على عنصر العدّاد */
  className?: string;
  /** لون مميّز للعدّاد — يأخذ من نص اللون Tailwind (مثل "text-primary") */
  colorClassName?: string;
  /** تأخير بداية الحركة بالميلي ثانية */
  delay?: number;
}

// easeOutExpo — أكثر بطئاً في النهاية من easeOutQuart
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

const arabicFormatter = new Intl.NumberFormat("ar-MA");

function defaultFormat(n: number): string {
  return arabicFormatter.format(Math.round(n));
}

export function AnimatedCounter({
  value,
  duration = 2000,
  formatFn,
  className,
  colorClassName,
  delay = 0,
}: AnimatedCounterProps) {
  const ref = React.useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = React.useState(0);
  const [started, setStarted] = React.useState(false);
  const prefersReduced = useReducedMotion();

  const format = formatFn ?? defaultFormat;

  // ─────────── Intersection Observer ───────────
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (started) return;
    const el = ref.current;
    if (!el) return;

    // لو تقليل الحركة مفعّل: نعرض القيمة مباشرة
    if (prefersReduced) {
      setDisplay(value);
      setStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStarted(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started, prefersReduced, value]);

  // ─────────── requestAnimationFrame ───────────
  React.useEffect(() => {
    if (!started) return;
    if (prefersReduced) {
      setDisplay(value);
      return;
    }

    let raf: number | null = null;
    const startTime = performance.now() + delay;

    const tick = (now: number) => {
      const elapsed = Math.max(0, now - startTime);
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutExpo(progress);
      const current = value * eased;
      setDisplay(current);

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [started, value, duration, delay, prefersReduced]);

  return (
    <motion.span
      ref={ref}
      className={`${colorClassName ?? ""} ${className ?? ""}`}
      initial={{ opacity: 0, y: 8 }}
      animate={started ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      transition={{ duration: 0.4, delay: delay / 1000 }}
      aria-label={format(value)}
      role="status"
      // نُظهر القيمة كنصّ، ونتجنّب وسم aria-hidden على العنصر نفسه
    >
      {format(display)}
    </motion.span>
  );
}
