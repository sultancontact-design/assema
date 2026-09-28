"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

// ===================================================================
//  Card3D v37.0 — بطاقة ثلاثية الأبعاد (Aceternity-inspired)
//  - mouse-tracking 3D tilt (rotateX + rotateY based on pointer)
//  - spring physics for smooth motion (stiffness 150, damping 20)
//  - glare highlight effect that follows the cursor
//  - respects prefers-reduced-motion (disables tilt)
//  - perspective-1000 wrapper
//  - usage: <Card3D>...children...</Card3D>
// ===================================================================

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  /** قوة الميلان (default 8 degrees) */
  intensity?: number;
  /** تعطيل الـ tilt (لكن يبقى الـ glare) */
  disableTilt?: boolean;
}

export function Card3D({
  children,
  className = "",
  intensity = 8,
  disableTilt = false,
}: Card3DProps) {
  const prefersReduced = useReducedMotion();
  const shouldTilt = !disableTilt && !prefersReduced;

  // قيم الموقع النسبي للمؤشر (0 إلى 1)
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  // اشتقاقات الميلان مع spring physics
  const rotateX = useSpring(
    useTransform(y, [0, 1], [shouldTilt ? intensity : 0, shouldTilt ? -intensity : 0]),
    { stiffness: 150, damping: 20, mass: 0.1 }
  );
  const rotateY = useSpring(
    useTransform(x, [0, 1], [shouldTilt ? -intensity : 0, shouldTilt ? intensity : 0]),
    { stiffness: 150, damping: 20, mass: 0.1 }
  );

  // اشتقاق موضع الـ glare (يتبع المؤشر) — يجب استدعاؤه دائماً (rules of hooks)
  const glareX = useTransform(x, [0, 1], ["0%", "100%"]);
  const glareY = useTransform(y, [0, 1], ["0%", "100%"]);
  const glareBg = useTransform(
    [glareX, glareY],
    ([gx, gy]) =>
      `radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,0.25), transparent 40%)`
  );

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!shouldTilt) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    x.set(Math.max(0, Math.min(1, px)));
    y.set(Math.max(0, Math.min(1, py)));
  };

  const handlePointerLeave = () => {
    if (!shouldTilt) return;
    // إعادة للمركز
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      className={`relative [perspective:1000px] ${className}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
    >
      {children}
      {/* glare — يتبع المؤشر */}
      {shouldTilt && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 hover:opacity-100"
          style={{ background: glareBg }}
        />
      )}
    </motion.div>
  );
}

export default Card3D;
