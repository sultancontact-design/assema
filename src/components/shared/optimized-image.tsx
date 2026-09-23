// ===================================================================
//  OptimizedImage — غلاف لمكوّن next/image مع إعدادات افتراضية محسّنة
//  - quality={45} افتراضياً (60% تقليل الحجم للصور العادية)
//  - loading="lazy" + placeholder="blur" دائماً
//  - يولّد blurDataURL افتراضياً (تدرّج بسيط بألوان زليج مراكش)
//    إن لم يُمرَّر من المستدعي
//  - خاصية priority ترفع الجودة إلى 75 وتُلغي الـblur للصور المهمّة فوق الطيّة
//
//  الاستخدام:
//    <OptimizedImage src="/events/cultural.svg" alt="فعالية ثقافية" width={64} height={64} />
//    <OptimizedImage src="/hero.jpg" alt="واجهة" fill priority />
// ===================================================================

import * as React from "react";
import NextImage, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

// ─────────── blurDataURL افتراضي ───────────
// صورة SVG صغيرة (8×8) فيها تدرّج كريم → ذهبي نحاسي.
// مُشفَّرة base64 وتُمرَّر كـ data URI.
// ملاحظة: next/image يتطلّب أن يكون blurDataURL صالحاً لـplaceholder="blur".

const BLUR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FBF6EE"/>
      <stop offset="0.5" stop-color="#F0E9DB"/>
      <stop offset="1" stop-color="#C8842A"/>
    </linearGradient>
  </defs>
  <rect width="8" height="8" fill="url(#g)" opacity="0.6"/>
</svg>`;

// base64 encoding يدوي (يعمل في الخادم والعميل على حدٍّ سواء)
function toBase64(str: string): string {
  // الخادم: Node.js Buffer متوفّر
  // العميل: btoa متوفّر في المتصفّح
  if (typeof window === "undefined") {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(str, "utf-8").toString("base64");
    }
  } else if (typeof btoa === "function") {
    try {
      // btoa يتطلّب Latin1 — نستعمل encodeURIComponent كحلٍّ بديل لـUTF-8
      return btoa(unescape(encodeURIComponent(str)));
    } catch {
      //تجاهل
    }
  }
  // fallback: ترميز URI
  return `data:image/svg+xml;utf8,${encodeURIComponent(str)}`;
}

const DEFAULT_BLUR = `data:image/svg+xml;base64,${toBase64(BLUR_SVG)}`;

// ─────────── الواجهة ───────────

export interface OptimizedImageProps
  extends Omit<ImageProps, "src" | "alt" | "quality" | "loading" | "placeholder" | "blurDataURL"> {
  /** مصدر الصورة — مسار نسبي داخل /public أو رابط URL */
  src: string;
  /** نص بديل وصفي (إلزامي للوصول) */
  alt: string;
  /** عرض الصورة بالبكسل (إن لم تُستعمل fill) */
  width?: number;
  /** ارتفاع الصورة بالبكسل (إن لم تُستعمل fill) */
  height?: number;
  /** هل الصورة مهمّة (above-the-fold)؟ ترفع الجودة إلى 75 وتُلغي الـblur */
  priority?: boolean;
  /** جودة مخصّصة (1-100). الافتراضي: 45 (75 للpriority) */
  quality?: number;
  /** أصناف Tailwind إضافية */
  className?: string;
}

/**
 * مكوّن OptimizedImage — يُحسّن next/image للصور المغربية المحلية.
 * - الافتراضي: quality=45, loading="lazy", placeholder="blur"
 * - عند تفعيل priority: quality=75, loading="eager", placeholder=none
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  quality,
  className,
  blurDataURL,
  sizes,
  ...rest
}: OptimizedImageProps) {
  const finalQuality = quality ?? (priority ? 75 : 45);
  const finalBlur = priority ? undefined : (blurDataURL ?? DEFAULT_BLUR);
  const finalPlaceholder = priority ? ("empty" as const) : ("blur" as const);
  const finalLoading = priority ? ("eager" as const) : ("lazy" as const);

  const imageProps = {
    src,
    alt,
    width,
    height,
    quality: finalQuality,
    loading: finalLoading,
    placeholder: finalPlaceholder,
    blurDataURL: finalBlur,
    priority,
    sizes: sizes ?? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
    className: cn("object-cover", className),
    ...rest,
  } as ImageProps;

  // لو fill، نحذف width/height
  if (rest.fill) {
    delete (imageProps as { width?: number }).width;
    delete (imageProps as { height?: number }).height;
  }

  return <NextImage {...imageProps} />;
}

export default OptimizedImage;
