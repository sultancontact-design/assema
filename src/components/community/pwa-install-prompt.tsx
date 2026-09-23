"use client";

import * as React from "react";
import { Download, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

/**
 * PWA install prompt — شريط طلب تثبيت المنصة على الشاشة الرئيسية
 *
 * - يستمع لحدث beforeinstallprompt (Chrome/Edge على Android/Desktop)
 * - يظهر بعد 30 ثانية من التصفّح
 * - يظهر مرة واحدة لكل جلسة (sessionStorage)
 * - "ليس الآن" يُخزّن في localStorage لمدّة 14 يوماً
 * - "تثبيت" يُطلُب الـ prompt الأصلي من المتصفّح
 *
 * على iOS Safari: لا يوجد beforeinstallprompt — يُظهر تعليمات يدوية مبسّطة
 */
const DISMISS_KEY = "pwa-install-dismissed-until";
const SESSION_KEY = "pwa-install-shown-this-session";
const DISMISS_DAYS = 14;
const INITIAL_DELAY_MS = 30_000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const [showIOSHint, setShowIOSHint] = React.useState(false);

  // 1) كشف beforeinstallprompt
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // كشف iOS Safari (لا يدعم beforeinstallprompt)
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error — iOS Safari独有的 standalone
      window.navigator.standalone === true;

    setIsIOS(isIOSDevice);

    if (isStandalone) {
      // المنصة مثبّتة بالفعل — لا تُظهر
      return;
    }

    // إذا تمّ رفض التثبيت مؤخّراً
    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (Date.now() < dismissedUntil) {
      return;
    }

    // إذا أُظهر هذا السشن بالفعل
    if (sessionStorage.getItem(SESSION_KEY)) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // انتظار 30 ثانية قبل العرض
      window.setTimeout(() => {
        setVisible(true);
        sessionStorage.setItem(SESSION_KEY, "1");
      }, INITIAL_DELAY_MS);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // على iOS: اعرض تعليمات يدوية بعد 30 ثانية
    if (isIOSDevice) {
      const timer = window.setTimeout(() => {
        setShowIOSHint(true);
        sessionStorage.setItem(SESSION_KEY, "1");
      }, INITIAL_DELAY_MS);
      return () => {
        window.removeEventListener("beforeinstallprompt", handler);
        window.clearTimeout(timer);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // 2) تثبيت — يُطلُب prompt الأصلي
  const handleInstall = async () => {
    if (!deferredPrompt) {
      setVisible(false);
      return;
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      // تمّ التثبيت — لا حاجة للظهور مرة أخرى
      setVisible(false);
    } else {
      // رُفض — خزّن لـ14 يوماً
      dismiss();
    }
    setDeferredPrompt(null);
  };

  // 3) رفض — يُخزّن لـ14 يوماً
  const dismiss = () => {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(until));
    setVisible(false);
    setShowIOSHint(false);
  };

  const shouldShow = visible || showIOSHint;
  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 md:pb-6 md:px-6 pointer-events-none"
        aria-live="polite"
      >
        <div className="mx-auto max-w-md pointer-events-auto rounded-2xl border border-primary/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 warm-shadow overflow-hidden">
          <div className="flex items-start gap-3 p-4">
            <span className="grid place-items-center size-10 rounded-xl bg-primary/10 text-primary shrink-0">
              <Smartphone className="size-5" />
            </span>

            <div className="flex-1 min-w-0 pt-0.5">
              <p className="font-heading font-bold text-sm text-foreground">
                📱 أضف المنصة لشاشتك الرئيسية
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                {isIOS ? (
                  <>
                    اضغط زر المشاركة في سفاري ثم «إلى الشاشة الرئيسية» لتثبيت
                    المنصة كتطبيق.
                  </>
                ) : (
                  <>
                    ثبّت «العاصمة» كتطبيق أسرع، يعمل دون اتصال، ويُرسِل إشعارات
                    المعروف فوراً.
                  </>
                )}
              </p>

              <div className="flex items-center gap-2 mt-3">
                {isIOS ? (
                  <Button
                    size="sm"
                    variant="default"
                    className="h-9 min-h-11 px-4"
                    onClick={dismiss}
                  >
                    <Download className="size-3.5" />
                    فهمت
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="default"
                    className="h-9 min-h-11 px-4"
                    onClick={handleInstall}
                  >
                    <Download className="size-3.5" />
                    تثبيت
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 min-h-11 px-3 text-muted-foreground"
                  onClick={dismiss}
                >
                  ليس الآن
                </Button>
              </div>
            </div>

            <button
              type="button"
              onClick={dismiss}
              aria-label="إغلاق"
              className="shrink-0 grid place-items-center size-7 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
