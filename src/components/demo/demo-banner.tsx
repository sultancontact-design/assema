"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, ChevronLeft } from "lucide-react";

// ===================================================================
//  DemoBanner — شريط وضع العرض التوضيحي (يُعرض فوق الـHero)
//  - يُخزَن حالة الإغلاق في localStorage
//  - يُظهر فقط إن لم يسبق للمستخدم إغلاقه
//  - تصميم RTL مع touch target ≥ 44px لزر الإغلاق
// ===================================================================

const STORAGE_KEY = "syba:demo-banner-dismissed";

export function DemoBanner() {
  const [visible, setVisible] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // بعد المونت: اقرأ localStorage لتحديد الإظهار
  React.useEffect(() => {
    setMounted(true);
    try {
      const dismissed = window.localStorage.getItem(STORAGE_KEY);
      if (dismissed !== "1") {
        setVisible(true);
      }
    } catch {
      // فشل القراءة (private mode مثلاً): اعرضه احتياطياً
      setVisible(true);
    }
  }, []);

  function handleDismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // تجاهل أخطاء الكتابة
    }
  }

  // منع mismatch: لا ترسم على الخادم
  if (!mounted) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="overflow-hidden border-b border-amber-300/60 bg-gradient-to-l from-amber-50 via-amber-100/80 to-amber-50 dark:from-amber-950/40 dark:via-amber-900/30 dark:to-amber-950/40 dark:border-amber-800/40"
          role="region"
          aria-label="شريط وضع العرض التوضيحي"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid place-items-center size-9 rounded-md bg-amber-200/80 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 shrink-0">
                <Sparkles className="size-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-950 dark:text-amber-100 truncate">
                  🎬 وضع العرض التوضيحي — جرّب المنصة بحساب مشرف
                </p>
                <p className="hidden sm:block text-xs text-amber-800/80 dark:text-amber-200/80 mt-0.5">
                  استعرض كل الأدوال وصلاحياتها قبل تجربتها فعلياً.
                </p>
              </div>
              <Link
                href="/demo-access"
                className="hidden sm:inline-flex items-center gap-1.5 h-11 px-3 rounded-md bg-amber-200/70 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100 text-sm font-medium hover:bg-amber-300/80 dark:hover:bg-amber-800/60 transition-colors shrink-0"
              >
                <span>صفحة العرض</span>
                <ChevronLeft className="size-4" />
              </Link>
              <Link
                href="/tour"
                className="hidden sm:inline-flex items-center gap-1.5 h-11 px-3 rounded-md bg-transparent border border-amber-300/70 dark:border-amber-800/50 text-amber-900 dark:text-amber-100 text-sm font-medium hover:bg-amber-200/50 dark:hover:bg-amber-900/30 transition-colors shrink-0"
              >
                <span>الجولة</span>
                <ChevronLeft className="size-4" />
              </Link>
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="إغلاق الشريط"
                className="grid size-11 place-items-center rounded-md text-amber-700 dark:text-amber-300 hover:bg-amber-200/60 dark:hover:bg-amber-900/40 transition-colors shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>
            {/* روابط للجوال */}
            <div className="sm:hidden mt-2 flex gap-2">
              <Link
                href="/demo-access"
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-md bg-amber-200/70 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100 text-sm font-medium hover:bg-amber-300/80 dark:hover:bg-amber-800/60 transition-colors"
              >
                <span>صفحة العرض</span>
                <ChevronLeft className="size-4" />
              </Link>
              <Link
                href="/tour"
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-md border border-amber-300/70 dark:border-amber-800/50 text-amber-900 dark:text-amber-100 text-sm font-medium hover:bg-amber-200/50 dark:hover:bg-amber-900/30 transition-colors"
              >
                <span>الجولة</span>
                <ChevronLeft className="size-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
