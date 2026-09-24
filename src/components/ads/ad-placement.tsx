"use client";

// ===================================================================
//  AdPlacement — مكوّن موضع إعلاني (client)
//  - أولاً: يستعلم عن AdSlot من قاعدة البيانات يطابق الموضع
//    - إن وُجد: يعرض محتواه (IMAGE/SCRIPT/HTML/ADSENSE)
//    - يسجّل ظهوراً عند العرض + نقرة عند الضغط
//  - ثانياً: لو لم يوجد AdSlot، يلجأ إلى AdSense من AdsProvider
//    (لو active=true و publisherId غير فارغ)
//  - ثالثاً: لو لا هذا ولا ذاك، يعرض placeholder بـ"مساحة إعلانية"
//  - أبعاد متجاوبة لكل موضع
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

// ─────────── خريطة مواضع AdPlacementType → AdSlot.position ───────────
const PLACEMENT_TO_POSITION: Record<AdPlacementType, string> = {
  "header-leaderboard": "HEADER",
  "sidebar-top": "SIDEBAR_TOP",
  "sidebar-bottom": "SIDEBAR_BOTTOM",
  "in-feed": "IN_FEED",
  "in-article": "IN_FEED", // في القلب تُعامل كداخل التدفق
  "footer-banner": "FOOTER",
};

// ─────────── أبعاد العرض لكل موضع ───────────
const PLACEMENT_SIZES: Record<
  AdPlacementType,
  { desktopW: number; desktopH: number; mobileW: number; mobileH: number; label: string }
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

const DEFAULT_SLOTS: Record<AdPlacementType, string> = {
  "header-leaderboard": "0000000001",
  "sidebar-top": "0000000002",
  "sidebar-bottom": "0000000003",
  "in-feed": "0000000004",
  "in-article": "0000000005",
  "footer-banner": "0000000006",
};

interface AdSlotPayload {
  id: string;
  name: string;
  position: string;
  type: string; // IMAGE | SCRIPT | HTML | ADSENSE
  content: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  width: number | null;
  height: number | null;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * AdPlacement — مكوّن موضع إعلاني متجاوب.
 * يفضّل AdSlot من قاعدة البيانات ثم AdSense ثم placeholder.
 */
export function AdPlacement({
  placement,
  className,
  hideOnMobile = false,
}: AdPlacementProps) {
  const { active, publisherId, testMode, slots } = useAds();
  const insRef = React.useRef<HTMLModElement>(null);
  const pushedRef = React.useRef(false);
  const viewedRef = React.useRef<string | null>(null);

  const [slot, setSlot] = React.useState<AdSlotPayload | null | undefined>(
    undefined
  );

  const position = PLACEMENT_TO_POSITION[placement] ?? "HEADER";
  const size = PLACEMENT_SIZES[placement];

  // 1) جلب AdSlot المطابق للموضع من قاعدة البيانات
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/public/ads/slots?position=${position}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          if (!cancelled) setSlot(null);
          return;
        }
        const data = (await res.json()) as { slot: AdSlotPayload | null };
        if (!cancelled) {
          setSlot(data.slot ?? null);
          if (data.slot) {
            viewedRef.current = data.slot.id;
          }
        }
      } catch {
        if (!cancelled) setSlot(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [position]);

  // 2) تنفيذ adsbygoogle.push بعد التحميل لو سنعرض AdSense (لو لا AdSlot)
  React.useEffect(() => {
    if (slot) return; // سنعرض AdSlot
    if (!active || !publisherId || pushedRef.current) return;
    if (typeof window === "undefined") return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch {
      // تجاهل: قد يحدث لو لم يُحمّل سكربت AdSense بعد
    }
  }, [active, publisherId, placement, slot]);

  // ─────────── مسار: عرض AdSlot من قاعدة البيانات ───────────
  if (slot) {
    const handleSlotClick = () => {
      // تسجيل نقرة (fire-and-forget)
      fetch(`/api/public/ads/slots/${slot.id}/click`, { method: "POST" }).catch(
        () => {}
      );
    };

    // IMAGE: صورة مع رابط اختياري
    if (slot.type === "IMAGE" && slot.imageUrl) {
      const Wrapper = slot.linkUrl ? "a" : "div";
      const wrapperProps = slot.linkUrl
        ? {
            href: slot.linkUrl,
            target: "_blank" as const,
            rel: "noopener noreferrer",
            onClick: handleSlotClick,
            "aria-label": slot.name,
          }
        : { onClick: handleSlotClick };
      return (
        <div
          className={cn(
            "flex items-center justify-center overflow-hidden rounded-md",
            hideOnMobile && "hidden md:flex",
            className
          )}
          style={{
            minHeight: `${slot.height ?? size.mobileH}px`,
            minWidth: slot.width ? `${slot.width}px` : undefined,
          }}
          role="complementary"
          aria-label={slot.name}
        >
          <Wrapper
            {...wrapperProps}
            className="block w-full"
            style={{ minHeight: "inherit" }}
          >
            <img
              src={slot.imageUrl}
              alt={slot.name}
              className="h-auto w-full max-w-full object-contain"
              style={{
                maxHeight: `${slot.height ?? size.desktopH}px`,
              }}
              loading="lazy"
            />
          </Wrapper>
        </div>
      );
    }

    // SCRIPT: سكربت خام (dangerouslySetInnerHTML)
    if (slot.type === "SCRIPT" && slot.content) {
      return (
        <div
          className={cn(
            "flex items-center justify-center overflow-hidden rounded-md",
            hideOnMobile && "hidden md:flex",
            className
          )}
          style={{ minHeight: `${slot.height ?? size.mobileH}px` }}
          role="complementary"
          aria-label={slot.name}
          onClick={handleSlotClick}
          dangerouslySetInnerHTML={{ __html: slot.content }}
        />
      );
    }

    // HTML: محتوى HTML خام (dangerouslySetInnerHTML)
    if (slot.type === "HTML" && slot.content) {
      return (
        <div
          className={cn(
            "flex items-center justify-center overflow-hidden rounded-md",
            hideOnMobile && "hidden md:flex",
            className
          )}
          style={{ minHeight: `${slot.height ?? size.mobileH}px` }}
          role="complementary"
          aria-label={slot.name}
          onClick={handleSlotClick}
          dangerouslySetInnerHTML={{ __html: slot.content }}
        />
      );
    }

    // ADSENSE: علامة ins باستخدام publisherId من السياق
    if (slot.type === "ADSENSE") {
      const slotId = slot.content?.trim() || slots[placement] || DEFAULT_SLOTS[placement];
      if (!active || !publisherId) {
        return <Placeholder hideOnMobile={hideOnMobile} className={className} size={size} />;
      }
      return (
        <div
          className={cn(
            "flex items-center justify-center overflow-hidden rounded-md",
            hideOnMobile && "hidden md:flex",
            className
          )}
          style={{ minHeight: `${size.mobileH}px` }}
          role="complementary"
          aria-label={slot.name || "محتوى إعلاني مدعوم"}
          onClick={handleSlotClick}
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
  }

  // ─────────── مسار: لا AdSlot — استعمال AdSense من الإعدادات ───────────
  if (!active || !publisherId) {
    // نعرض placeholder فقط بعد التأكّد من عدم وجود AdSlot
    if (slot === undefined) {
      return (
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-muted/30 text-muted-foreground/70",
            hideOnMobile && "hidden md:flex",
            className
          )}
          style={{ minHeight: `${size.mobileH}px` }}
          role="complementary"
          aria-label="مساحة إعلانية"
        >
          <span className="size-4 animate-pulse rounded-full bg-muted-foreground/30" />
        </div>
      );
    }
    return (
      <Placeholder
        hideOnMobile={hideOnMobile}
        className={className}
        size={size}
      />
    );
  }

  // ─────────── مسار: لا AdSlot — AdSense من الإعدادات ───────────
  const slotId = slots[placement] ?? DEFAULT_SLOTS[placement];
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-md",
        hideOnMobile && "hidden md:flex",
        className
      )}
      style={{ minHeight: `${size.mobileH}px` }}
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

// ─────────── Placeholder مغربي الأناقة ───────────
function Placeholder({
  hideOnMobile,
  className,
  size,
}: {
  hideOnMobile: boolean;
  className?: string;
  size: { mobileH: number; label: string };
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-muted/30 text-muted-foreground/70",
        hideOnMobile && "hidden md:flex",
        className
      )}
      style={{ minHeight: `${size.mobileH}px` }}
      role="complementary"
      aria-label="مساحة إعلانية"
    >
      <Megaphone className="size-5 opacity-60" aria-hidden="true" />
      <p className="text-[11px] font-medium">مساحة إعلانية</p>
      <p className="text-[10px] opacity-60">{size.label}</p>
    </div>
  );
}

export default AdPlacement;
