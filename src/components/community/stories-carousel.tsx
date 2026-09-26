"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ===================================================================
//  StoriesCarousel → StoriesBento v35.2 — Bento Grid (anti-AI-slop)
//  - البطاقة الأولى featured (col-span-2 + row-span-2)
//  - 4 بطاقات أصغر في المساحة المتبقية
//  - لا carousel (الـ carousel نمط قديم)
//  - تدرّجات لونية مغربية + صورة placeholder
// ===================================================================

export interface StoryCard {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  category?: string;
  href: string;
  gradient?: string;
  emoji?: string;
}

interface StoriesBentoProps {
  stories: StoryCard[];
  isVisitor?: boolean;
}

const DEFAULT_GRADIENTS = [
  "from-primary/80 via-accent/60 to-secondary/70",
  "from-secondary/80 via-primary/40 to-accent/70",
  "from-accent/80 via-primary/50 to-secondary/70",
  "from-primary/70 via-secondary/60 to-accent/70",
  "from-secondary/70 via-accent/60 to-primary/70",
];

export function StoriesCarousel({ stories, isVisitor = false }: StoriesBentoProps) {
  const items = React.useMemo<StoryCard[]>(
    () =>
      stories.map((s, i) => ({
        ...s,
        gradient: s.gradient ?? DEFAULT_GRADIENTS[i % DEFAULT_GRADIENTS.length]!,
      })),
    [stories]
  );

  if (items.length === 0) {
    return (
      <Card className="border-dashed bg-muted/30 p-8 text-center text-muted-foreground">
        لا توجد قصص لعرضها حالياً.
      </Card>
    );
  }

  // Bento: أول بطاقة featured (col-span-2 row-span-2)، الباقي صغير
  const [featured, ...rest] = items;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[180px]">
      {/* البطاقة المميّزة — تأخذ 2 أعمدة + صفّين */}
      {featured && (
        <Card key={featured.id} className="md:col-span-2 md:row-span-2 relative overflow-hidden border-0 warm-shadow card-glow lift-on-hover group">
          {/* خلفية متدرّجة */}
          <div className={`absolute inset-0 bg-gradient-to-br ${featured.gradient}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          {/* رمز كبير في الأعلى */}
          <div className="absolute top-6 end-6">
            {featured.category && (
              <Badge className="bg-background/90 text-foreground border-0">
                {featured.category}
              </Badge>
            )}
          </div>

          {/* محتوى أسفل البطاقة */}
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
            <h3 className="font-heading font-extrabold text-2xl md:text-3xl text-background mb-2 leading-tight line-clamp-2">
              <Link href={featured.href} className="hover:underline">
                {featured.title}
              </Link>
            </h3>
            <p className="text-background/90 text-sm md:text-base line-clamp-2 leading-relaxed mb-3 max-w-xl">
              {featured.excerpt}
            </p>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-background/90 text-xs">
                <span className="grid size-6 place-items-center rounded-full bg-background/30 text-background text-[10px] font-bold">
                  {featured.author.slice(0, 1)}
                </span>
                {featured.author}
              </span>
              <Link href={featured.href} className="inline-flex items-center gap-1 text-background text-xs font-bold hover:underline">
                اقرأ المزيد
                <ArrowLeft className="size-3.5" />
              </Link>
            </div>
          </div>

          {isVisitor && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <span className="rounded-full bg-background/95 px-4 py-1.5 text-xs font-medium text-foreground shadow-lg">
                سجّل للقصة الكاملة
              </span>
            </div>
          )}
        </Card>
      )}

      {/* البطاقات الصغيرة — 4 في مساحة 1×4 */}
      {rest.slice(0, 4).map((story, idx) => (
        <Card key={story.id} className="relative overflow-hidden border-0 warm-shadow card-glow lift-on-hover group">
          {/* شريط متدرّج علوي */}
          <div className={`h-16 bg-gradient-to-r ${story.gradient} flex items-center px-4`}>
            <BookOpen className="size-5 text-background/90" />
            {story.category && (
              <Badge className="ms-auto bg-background/90 text-foreground border-0 text-[10px]">
                {story.category}
              </Badge>
            )}
          </div>

          <div className="p-4">
            <h3 className="font-heading font-bold text-base text-foreground line-clamp-2 leading-snug mb-1.5">
              <Link href={story.href} className="underline-animate">
                {story.title}
              </Link>
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
              {story.excerpt}
            </p>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="grid size-4 place-items-center rounded-full bg-primary/10 text-primary text-[9px] font-bold">
                  {story.author.slice(0, 1)}
                </span>
                {story.author}
              </span>
              <span aria-hidden="true">#{idx + 2}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default StoriesCarousel;
