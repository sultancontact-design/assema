"use client";

// ===================================================================
//  StoriesCarousel — كاروسيل قصص المدوّنة
//  - يستعمل embla-carousel-react (مثبّت)
//  - تشغيل تلقائي كل 5 ثوانٍ (تنفيذ ذاتي عبر embla.scrollTo)
//  - إيقاف عند الـhover
//  - 5 بطاقات: صورة (placeholder gradient) + عنوان + مقتطف + كاتب
//  - للزوار: تدرّج إخفاء في الأسفل + overlay "سجّل للقصة الكاملة"
//  - نقاط ترقيم + أسهم تنقّل
// ===================================================================

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronRight, ChevronLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface StoryCard {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  category?: string;
  href: string;
  /** تدرّج لوني خلفي للبطاقة (Tailwind gradient classes) */
  gradient: string;
  emoji?: string;
}

interface StoriesCarouselProps {
  stories: StoryCard[];
  /** هل المستخدم زائر؟ نُظهر overlay للترقية للتسجيل */
  isVisitor?: boolean;
}

const DEFAULT_AUTOPLAY_MS = 5_000;

// التدرّجات الخمس بالألوان المغربية (تتناوب)
const DEFAULT_GRADIENTS = [
  "from-primary/80 via-accent/60 to-secondary/70",
  "from-secondary/80 via-primary/40 to-accent/70",
  "from-accent/80 via-primary/50 to-secondary/70",
  "from-primary/70 via-secondary/60 to-accent/70",
  "from-secondary/70 via-accent/60 to-primary/70",
];

export function StoriesCarousel({ stories, isVisitor = false }: StoriesCarouselProps) {
  // نُجهّز التدرّجات لكل قصة لو لم تُحدّد
  const items = React.useMemo<StoryCard[]>(
    () =>
      stories.map((s, i) => ({
        ...s,
        gradient: s.gradient ?? DEFAULT_GRADIENTS[i % DEFAULT_GRADIENTS.length]!,
      })),
    [stories]
  );

  const [emblaRef, embla] = useEmblaCarousel({
    loop: items.length > 1,
    align: "start",
    direction: "rtl",
  });
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [snapCount, setSnapCount] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  // ─────────── التحديث عند تغيّر الـslide ───────────
  const onSelect = React.useCallback(() => {
    if (!embla) return;
    setSelectedIndex(embla.selectedScrollSnap());
  }, [embla]);

  React.useEffect(() => {
    if (!embla) return;
    setSnapCount(embla.scrollSnapList().length);
    embla.on("select", onSelect);
    embla.on("reInit", onSelect);
    onSelect();
    return () => {
      embla.off("select", onSelect);
      embla.off("reInit", onSelect);
    };
  }, [embla, onSelect]);

  // ─────────── التشغيل التلقائي ───────────
  React.useEffect(() => {
    if (!embla || items.length <= 1 || paused) return;
    const id = window.setInterval(() => {
      embla.scrollNext();
    }, DEFAULT_AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [embla, items.length, paused]);

  const scrollPrev = React.useCallback(() => {
    embla?.scrollPrev();
  }, [embla]);
  const scrollNext = React.useCallback(() => {
    embla?.scrollNext();
  }, [embla]);

  if (items.length === 0) {
    return (
      <Card className="border-dashed bg-muted/30 p-8 text-center text-muted-foreground">
        لا توجد قصص لعرضها حالياً.
      </Card>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div ref={emblaRef} className="overflow-hidden" dir="rtl">
        <div className="flex gap-4">
          {items.map((story, idx) => (
            <StorySlide key={story.id} story={story} index={idx} isVisitor={isVisitor} />
          ))}
        </div>
      </div>

      {/* أسهم التنقّل */}
      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="السابق"
            className="absolute top-1/2 -translate-y-1/2 start-2 z-20 grid size-10 place-items-center rounded-full border border-border bg-background/95 text-foreground shadow-md press-on-active hover:bg-muted transition-colors"
          >
            <ChevronRight className="size-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="التالي"
            className="absolute top-1/2 -translate-y-1/2 end-2 z-20 grid size-10 place-items-center rounded-full border border-border bg-background/95 text-foreground shadow-md press-on-active hover:bg-muted transition-colors"
          >
            <ChevronLeft className="size-5" />
          </button>
        </>
      )}

      {/* نقاط الترقيم */}
      {snapCount > 1 && (
        <div className="mt-4 flex justify-center gap-1.5" dir="ltr">
          {Array.from({ length: snapCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`اذهب إلى الشريحة ${i + 1}`}
              aria-current={selectedIndex === i}
              onClick={() => embla?.scrollTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                selectedIndex === i
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StorySlide({
  story,
  index,
  isVisitor,
}: {
  story: StoryCard;
  index: number;
  isVisitor: boolean;
}) {
  return (
    <div
      className="relative shrink-0 grow-0 basis-full sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(33.333%-0.667rem)]"
      dir="rtl"
    >
      <Card className="relative overflow-hidden border-0 warm-shadow card-glow">
        {/* رأس البطاقة: تدرّج لوني مع رمز تعبيري */}
        <div
          className={`relative h-40 bg-gradient-to-br ${story.gradient} flex items-center justify-center`}
        >
          <span className="text-5xl drop-shadow-sm" aria-hidden="true">
            {story.emoji ?? <BookOpen className="size-10 text-background/90" />}
          </span>
          {story.category && (
            <Badge className="absolute top-3 end-3 bg-background/90 text-foreground border-0">
              {story.category}
            </Badge>
          )}
          {isVisitor && (
            <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 to-transparent p-3">
              <span className="rounded-full bg-background/95 px-3 py-1 text-xs font-medium text-foreground shadow">
                سجّل للقصة الكاملة
              </span>
            </div>
          )}
        </div>

        {/* جسم البطاقة */}
        <div className="p-4">
          <h3 className="font-heading font-bold text-lg text-foreground line-clamp-2 leading-snug">
            <Link href={story.href} className="underline-animate">
              {story.title}
            </Link>
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {story.excerpt}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                {story.author.slice(0, 1)}
              </span>
              {story.author}
            </span>
            <span aria-hidden="true">#{index + 1}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
