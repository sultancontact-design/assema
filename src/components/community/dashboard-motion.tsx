"use client";

import { motion } from "framer-motion";

/**
 * غلاف حركي خفيف لصفحة لوحة المجتمع
 * - أنيميشن دخول تدريجي (opacity + y)
 * - يعمل على الأقسام المُمرَّرة كأبناء
 */
export function DashboardMotion({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
