"use client";

// ===================================================================
//  AdPlacement — مكوّن موضع إعلاني (client)
//  - يقرأ إعدادات AdSense من AdsProvider عبر useAds()
//  - لو active=true: يُعرض <ins class="adsbygoogle"> مع data-ad-client +
//    data-ad-slot، ويُنفّذ (adsbygoogle.push({})) بعد التحميل
//  - لو active=false: يُعرض placeholder بـ"مساحة إعلانية" بألوان زليج
//  - أبعاد متجاوبة: لكل موضع أبعاد مختلفة على الجوال وسطح المكتب
//  - مع وضع التجربة (testMode): يضيف data-ad-test="on"
//
//  المواضع المدعومة:
//    header-leaderboard: 728×90 سطح المكتب، 320×50 الجوال
//    sidebar-top/sidebar-bottom: 300×250
//    in-feed: 600×200 (يتكيّف)
//    in-article: 468×120
//    footer-banner: 728×90 سطح المكتب، 320×50 الجوال
// ===================================================================

import * as React from "react";
import { Megaphone } from "lucide-react";
import { useAds, type AdPlacementType } from "@/components/ads/ads-provider";
import { cn } from "@/lib/utils";

interface AdPlacementProps {
  /** نوع الموضع الإعلاني */
  placement: AdPlacementType;
  /** أصناف Tailwind إضافية */
  className?: string;
  /** ما إذا كان يجب إخفاء الموضع في الجوال (false افتراضياً) */
  hideOnMobile?: boolean;
}

// ─────────── أبعاد العرض لكل موضع ───────────
// - desktop: الأبعاد على شاشات ≥ 768px
// - mobile: الأبعاد على شاشات < 768px
// - minH: أقل ارتفاع (CSS) لتفادي تقلّص الحيّز
const PLACEMENT_SIZES: Record<
  AdPlacementType,
  {
    desktopW: number;
    desktopH: number;
    mobileW: number;
    mobileH: number;
    label: string;
  }
> = {
  "header-leaderboard": {
    desktopW: 728,
    desktopH: 90,
    mobileW: 320,
    mobileH: 50,
    label: "728×90 / 320×50",
  },
  "sidebar-top": {
    desktopW: 300,
    desktopH: 250,
    mobileW: 300,
    mobileH: 100,
    label: "300×250",
  },
  "sidebar-bottom": {
    desktopW: 300,
    desktopH: 250,
    mobileW: 300,
    mobileH: 100,
    label: "300×250",
  },
  "in-feed": {
    desktopW: 600,
    desktopH: 200,
    mobileW: 320,
    mobileH: 150,
    label: "تكيّفي",
  },
  "in-article": {
    desktopW: 468,
    desktopH: 120,
    mobileW: 320,
    mobileH: 100,
    label: "468×120",
  },
  "footer-banner": {
    desktopW: 728,
    desktopH: 90,
    mobileW: 320,
    mobileH: 50,
    label: "728×90 / 320×50",
  },
};

// slot افتراضي لكل موضع (يُستعمل إن لم يُضبط في Setting)
const DEFAULT_SLOTS: Record<AdPlacementType, string> = {
  "header-leaderboard": "0000000001",
  "sidebar-top": "0000000002",
  "sidebar-bottom": "0000000003",
  "in-feed": "0000000004",
  "in-article": "0000000005",
  "footer-banner": "0000000006",
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * AdPlacement — مكوّن موضع إعلاني متجاوب.
 * يعرض إعلان AdSense حقيقياً عند التفعيل، أو placeholder مغربي الأناقة.
 */
export function AdPlacement({
  placement,
  className,
  hideOnMobile = false,
}: AdPlacementProps) {
  const { active, publisherId, testMode, slots } = useAds();
  const insRef = React.useRef<HTMLModElement>(null);
  const pushedRef = React.useRef(false);

  // تنفيذ adsbygoogle.push بعد التحميل لتفعيل عرض الإعلان
  React.useEffect(() => {
    if (!active || !publisherId || pushedRef.current) return;
    if (typeof window === "undefined") return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch {
      // تجاهل: قد يحدث لو لم يُحمّل سكربت AdSense بعد
    }
  }, [active, publisherId, placement]);

  const size = PLACEMENT_SIZES[placement];
  const slotId = slots[placement] ?? DEFAULT_SLOTS[placement];

  // ─────────── placeholder مغربي (لو غير مفعّل) ───────────
  if (!active || !publisherId) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-muted/30 text-muted-foreground/70",
          hideOnMobile && "hidden md:flex",
          className
        )}
        style={{
          minHeight: `${size.mobileH}px`,
        }}
        role="complementary"
        aria-label="مساحة إعلانية"
      >
        <Megaphone className="size-5 opacity-60" aria-hidden="true" />
        <p className="text-[11px] font-medium">مساحة إعلانية</p>
        <p className="text-[10px] opacity-60">{size.label}</p>
      </div>
    );
  }

  // ─────────── إعلان AdSense حقيقي ───────────
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-md",
        hideOnMobile && "hidden md:flex",
        className
      )}
      style={{
        minHeight: `${size.mobileH}px`,
      }}
      role="complementary"
      aria-label="محتوى إعلاني مدعوم"
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", height: "100%" }}
        data-ad-client={publisherId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
        {...(testMode ? { "data-ad-test": "on" } : {})}
      />
    </div>
  );
}

export default AdPlacement;
