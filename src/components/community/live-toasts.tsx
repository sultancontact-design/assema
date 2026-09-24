"use client";

// ===================================================================
//  LiveToasts — إشعارات حيّة تظهر على الصفحة العامة
//  - تظهر كل 15-30 ثانية (تأخير عشوائي) في الزاوية اليسرى السفلى (RTL)
//  - تجلب من /api/public/activity-feed وتختار نشاطاً عشوائياً
//  - تُظهر الإشعار عبر sonner toast.success
//  - تختفي تلقائياً بعد 5 ثوانٍ (sonner default = duration)
//  - تظهر فقط على الصفحات العامة (لا /admin ولا /login ولا /community/*)
// ===================================================================

import * as React from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Activity as ActivityIcon } from "lucide-react";
import type { ActivityItem } from "@/components/community/activity-ticker";

function isPublicPage(pathname: string): boolean {
  if (!pathname) return false;
  // الصفحات غير العمومية: الإدارة + المصادقة + لوحة المجتمع
  const excluded = ["/admin", "/login", "/community", "/register", "/2fa", "/verify-request"];
  for (const p of excluded) {
    if (pathname === p || pathname.startsWith(p + "/")) return false;
  }
  return true;
}

// ثانية × 1000
const MIN_INTERVAL = 15_000;
const MAX_INTERVAL = 30_000;
const TOAST_DURATION_MS = 5_000;

function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function LiveToasts() {
  const pathname = usePathname();
  const publicPage = isPublicPage(pathname);

  const lastShownRef = React.useRef<string | null>(null);

  // ─────────── الاستطلاع اللطيف للنشاطات ───────────
  const fetchOneAndToast = React.useCallback(async () => {
    if (!publicPage) return;
    try {
      const res = await fetch("/api/public/activity-feed", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as ActivityItem[];
      if (!Array.isArray(data) || data.length === 0) return;

      // تجنّب تكرار نفس الإشعار مرّتين متتاليتين
      const candidates = lastShownRef.current
        ? data.filter((it) => it.description !== lastShownRef.current)
        : data;
      const pool = candidates.length > 0 ? candidates : data;
      const picked = pickRandom(pool);
      if (!picked) return;
      lastShownRef.current = picked.description;

      toast.success(picked.description, {
        description: `من حيّ سيدي يوسف بن علي · ${picked.timeAgo}`,
        duration: TOAST_DURATION_MS,
        icon: <ActivityIcon className="size-4 text-primary" />,
      });
    } catch {
      // صمت: لا نريد أن نُزعج المستخدم بأخطاء الشبكة
    }
  }, [publicPage]);

  React.useEffect(() => {
    if (!publicPage) return;

    // أول إشعار بعد 6 ثوانٍ من تحميل الصفحة (لا نريد إزعاج الزائر فور دخوله)
    const firstDelay = 6_000;
    let timeout: number | undefined;

    const scheduleNext = () => {
      const delay = MIN_INTERVAL + Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL));
      timeout = window.setTimeout(async () => {
        await fetchOneAndToast();
        scheduleNext();
      }, delay);
    };

    const firstTimer = window.setTimeout(() => {
      void fetchOneAndToast();
      scheduleNext();
    }, firstDelay);

    return () => {
      if (firstTimer) window.clearTimeout(firstTimer);
      if (timeout) window.clearTimeout(timeout);
    };
  }, [publicPage, fetchOneAndToast]);

  // هذا المكوّن لا يُرجع شيئاً مرئياً بنفسه — الإشعارات تُدار من sonner
  return null;
}
