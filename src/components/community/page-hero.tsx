import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  SECTION_THEMES,
  type SectionKey,
} from "@/components/layout/section-theme";

// ===================================================================
//  PageHero v61.0 — Hero موحّد + هوية لونية لكل قسم
//  - يقبل section prop لاختيار الألوان (10+ أقسام)
//  - يستبدل صورة الخلفية المعتّمة بـ gradient حيوي + Aurora tint
//  - يحتفظ بصورة الخلفية كطبقة شفافة إن وُجدت
//  - زر breadcrumb + badge + عنوان display + نص فرعي
//  - dir="rtl" تلقائياً من html
// ===================================================================

interface PageHeroProps {
  title: string;
  subtitle?: string;
  image?: string;
  imageAlt?: string;
  breadcrumb?: string;
  badge?: string;
  section?: SectionKey;
}

export function PageHero({
  title,
  subtitle,
  image,
  imageAlt = "",
  breadcrumb = "المجتمع",
  badge,
  section = "community",
}: PageHeroProps) {
  const theme = SECTION_THEMES[section] ?? SECTION_THEMES.community;

  return (
    <section
      className="relative overflow-hidden border-b border-border"
      style={{
        // ضبط متغيّرات CSS للقسم — يمكن استخدامها في أي مكوّن فرعي
        ["--section-primary" as string]: theme.primary,
        ["--section-secondary" as string]: theme.secondary,
        ["--section-accent" as string]: theme.accent,
        ["--section-glow" as string]: theme.glowColor,
      }}
    >
      {/* 1) صورة الخلفية (إن وُجدت) — طبقة شفافة */}
      {image && (
        <div className="absolute inset-0 z-0">
          <img
            src={image}
            alt={imageAlt}
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.55) saturate(0.9)" }}
            loading="eager"
          />
        </div>
      )}

      {/* 2) Gradient حيوي بطبقتين (لون القسم) */}
      <div
        className={`absolute inset-0 z-0 bg-gradient-to-br ${theme.gradient} ${
          image ? "opacity-85" : "opacity-100"
        }`}
        aria-hidden
      />
      {/* 3) تدرّج من الأسفل للقراءة */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)",
        }}
        aria-hidden
      />
      {/* 4) Aurora tint بطبقات شفافة من ألوان القسم */}
      <div
        className="absolute inset-0 z-0 opacity-60"
        style={{
          background: `radial-gradient(at 20% 30%, ${theme.primary}40, transparent 50%), radial-gradient(at 80% 70%, ${theme.secondary}40, transparent 50%)`,
        }}
        aria-hidden
      />

      {/* المحتوى */}
      <div className="relative z-10 min-h-[300px] max-h-[460px] h-[40vh] flex items-end">
        <div className="container-fluid pb-10 md:pb-14">
          {/* breadcrumb */}
          <div className="mb-3">
            <Link
              href="/community"
              className="inline-flex items-center gap-1 text-xs text-white/85 hover:text-white transition-colors"
            >
              <ChevronLeft className="size-3.5" />
              <span>{breadcrumb}</span>
            </Link>
          </div>

          {/* badge (اختياري) */}
          {badge && (
            <span
              className="inline-flex items-center gap-1.5 mb-3 rounded-full px-3 py-1 text-xs font-medium text-white backdrop-blur-md border border-white/30"
              style={{ background: "rgba(255, 255, 255, 0.18)" }}
            >
              {theme.emoji && <span aria-hidden>{theme.emoji}</span>}
              {badge}
            </span>
          )}

          {/* عنوان display */}
          <h1
            className="font-heading font-extrabold text-white leading-[1.1] tracking-tight mb-2"
            style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
          >
            {title}
          </h1>

          {/* نص فرعي */}
          {subtitle && (
            <p className="text-base md:text-lg text-white/90 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}

          {/* شريط هوية القسم — لون متدرّج */}
          <div
            className="mt-4 h-1 w-24 rounded-full"
            style={{
              background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})`,
            }}
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}

export default PageHero;
