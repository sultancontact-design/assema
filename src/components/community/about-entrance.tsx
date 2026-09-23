// ===================================================================
//  AboutEntrance — مكوّن دخول بـ framer-motion لصفحة "من نحن"
//  يأخذ children + optional delay + optional hero/card mode
// ===================================================================

"use client";

import * as React from "react";
import { motion } from "framer-motion";

interface AboutEntranceProps {
  children: React.ReactNode;
  /** مدّة التأخير بالثواني */
  delay?: number;
  /** وضع hero — تأثير دخول أكبر */
  hero?: boolean;
  /** وضع بطاقة — تأثير تصاعدي خفيف */
  card?: boolean;
}

export function AboutEntrance({
  children,
  delay = 0,
  hero = false,
  card = false,
}: AboutEntranceProps) {
  const initial = hero
    ? { opacity: 0, y: 24, filter: "blur(8px)" }
    : card
      ? { opacity: 0, y: 12 }
      : { opacity: 0, y: 16 };

  const animate = hero
    ? { opacity: 1, y: 0, filter: "blur(0px)" }
    : { opacity: 1, y: 0 };

  const transition = hero
    ? { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const }
    : { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={{ once: true, margin: "-80px" }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}
