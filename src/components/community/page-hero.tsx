import Link from "next/link";
import { ChevronLeft } from "lucide-react";

// ===================================================================
//  PageHero v35.3 — Hero موحّد لصفحات Community
//  - صورة خلفية معتّمة + عنوان display + نص فرعي
//  - breadcrumb علوي (المجتمع > الصفحة الحالية)
//  - تخطيط يساري (لا text-center) — يبدأ من الأسفل
//  - dir="rtl" تلقائياً من html
// ===================================================================

interface PageHeroProps {
  title: string;
  subtitle?: string;
  image: string;
  imageAlt: string;
  breadcrumb?: string;
  badge?: string;
}

export function PageHero({
  title,
  subtitle,
  image,
  imageAlt,
  breadcrumb = "المجتمع",
  badge,
}: PageHeroProps) {
  return (
    <section className="relative h-[40vh] min-h-[300px] max-h-[460px] overflow-hidden border-b border-border">
      {/* صورة الخلفية */}
      <div className="absolute inset-0 z-0">
        <img
          src={image}
          alt={imageAlt}
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.6) saturate(0.9)" }}
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
      </div>

      {/* المحتوى — يبدأ من الأسفل (items-end) */}
      <div className="relative z-10 h-full flex items-end">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-10 md:pb-14">
          {/* breadcrumb */}
          <div className="mb-3">
            <Link
              href="/community"
              className="inline-flex items-center gap-1 text-xs text-white/80 hover:text-white transition-colors"
            >
              <ChevronLeft className="size-3.5" />
              <span>{breadcrumb}</span>
            </Link>
          </div>

          {/* badge (اختياري) */}
          {badge && (
            <span className="inline-block mb-3 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white border border-white/20">
              {badge}
            </span>
          )}

          {/* عنوان display */}
          <h1
            className="font-heading font-extrabold text-white leading-[1.05] tracking-tight mb-2"
            style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)" }}
          >
            {title}
          </h1>

          {/* نص فرعي */}
          {subtitle && (
            <p className="text-base md:text-lg text-white/85 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default PageHero;
