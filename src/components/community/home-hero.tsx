"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ===================================================================
//  HomeHero v35.0 — Editorial Bento (anti-AI-slop)
//  - تخطيط غير متمركز: 7/5 أعمدة (محتوى + بطاقة إحصاء)
//  - عنوان display ضخم (clamp 2.5rem→5rem) — لا تظليل كلمة واحدة
//  - حركة واحدة منسّقة عند التحميل (لا fade-up على كل عنصر)
//  - يبدأ بالنص (editorial)، الصورة في الخلفية معتّمة (بدل أن تأكل التركيز)
//  - بطاقة الإحصاء الحيّ على الجانب (النمط: رقم كبير + label + مصدر)
// ===================================================================

export function HomeHero() {
  const prefersReduced = useReducedMotion();

  // حركة واحدة منسّقة عند التحميل فقط (لا scroll transforms)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
    },
  };

  return (
    <section
      className="relative overflow-hidden border-b border-border"
      aria-labelledby="hero-heading"
    >
      {/* صورة خلفية معتّمة (لا تأكل التركيز — النص هو البطل) */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1539020140153-e479b8c5e640?auto=format&fit=crop&w=1600&q=70"
          alt="مراكش — المدينة الحمراء"
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.55) saturate(0.85)" }}
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-background/95 via-background/70 to-background/40" />
      </div>

      {/* شبكة 7/5: محتوى يمين (RTL) + بطاقة إحصاء يسار */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-28">
        <motion.div
          variants={prefersReduced ? undefined : containerVariants}
          initial={prefersReduced ? "visible" : "hidden"}
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end"
        >
          {/* المحتوى الرئيسي — 7 أعمدة */}
          <div className="lg:col-span-7 max-w-2xl">
            {/* علامة صغيرة تحريرية (لا ALL-CAPS متباعدة) */}
            <motion.div variants={prefersReduced ? undefined : itemVariants}>
              <Badge variant="outline" className="bg-background/40 backdrop-blur-sm border-border/60 text-foreground mb-5">
                <span className="size-1.5 rounded-full bg-secondary inline-block" />
                منصة المعروف الرقمي
              </Badge>
            </motion.div>

            {/* عنوان display — clamp 2.5→5rem، لا تظليل كلمة واحدة */}
            <motion.h1
              variants={prefersReduced ? undefined : itemVariants}
              id="hero-heading"
              className="font-heading font-extrabold text-foreground leading-[1.05] tracking-tight"
              style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
            >
              من حيّ إلى عاصمة
              <br />
              <span className="text-primary">المعروف الرقمي</span>
            </motion.h1>

            {/* نص فرعي — line-height سخي */}
            <motion.p
              variants={prefersReduced ? undefined : itemVariants}
              className="mt-6 text-base md:text-lg text-muted-foreground leading-[1.7] max-w-xl"
            >
              منصة تضامنية تجمع أسر حيّ سيدي يوسف بن علي بمراكش على الخير
              والعطاء — صندوق معروف رقمي، فعاليات، خدمات، وأسعار سوق شفّافة.
            </motion.p>

            {/* أزرار CTA — غير متمركزة */}
            <motion.div
              variants={prefersReduced ? undefined : itemVariants}
              className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3"
            >
              <Button asChild size="lg" className="h-12 px-6 text-base font-semibold bg-primary hover:bg-primary/90 border-0">
                <Link href="/community">
                  انضمّ إلى الحيّ
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base bg-background/60 backdrop-blur-sm border-border/60 hover:bg-background/80">
                <Link href="/community/fund">
                  تعرّف على الصندوق
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* بطاقة الإحصاء الحيّ — 5 أعمدة (نمط KPI: رقم + label + مصدر) */}
          <motion.div
            variants={prefersReduced ? undefined : itemVariants}
            className="lg:col-span-5 lg:col-start-8"
          >
            <div className="rounded-2xl border border-border/60 bg-background/85 backdrop-blur-md p-6 shadow-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  صندوق المعروف — الإجمالي المُؤكَّد
                </span>
                <span className="size-1.5 rounded-full bg-secondary animate-pulse" />
              </div>
              <div className="font-heading font-extrabold text-foreground tabular-nums" style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}>
                <LiveFundTotal />
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                درهم مغربي · مُحدَّث لحظياً من قاعدة البيانات
              </div>
              <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">الأسر النشطة</div>
                  <div className="font-heading font-bold text-xl text-foreground tabular-nums mt-0.5">
                    <LiveFamiliesCount />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">الفعاليات القادمة</div>
                  <div className="font-heading font-bold text-xl text-foreground tabular-nums mt-0.5">
                    <LiveEventsCount />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ===================================================================
//  Live counters — fetch from /api/public/stats (client-side)
//  - يتجنّب فشل SSR على Vercel (DB unreachable at build time)
//  - نص بديل واضح أثناء التحميل (ليس spinner)
// ===================================================================
function LiveFundTotal() {
  const [value, setValue] = React.useState<string>("— —");
  React.useEffect(() => {
    fetch("/api/public/stats")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.contributionsTotal === "number") {
          setValue(formatNumber(d.contributionsTotal));
        }
      })
      .catch(() => setValue("— —"));
  }, []);
  return <>{value}</>;
}

function LiveFamiliesCount() {
  const [value, setValue] = React.useState<number | string>("—");
  React.useEffect(() => {
    fetch("/api/public/stats")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.families === "number") setValue(d.families);
      })
      .catch(() => setValue("—"));
  }, []);
  return <>{value}</>;
}

function LiveEventsCount() {
  const [value, setValue] = React.useState<number | string>("—");
  React.useEffect(() => {
    fetch("/api/public/stats")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.events === "number") setValue(d.events);
      })
      .catch(() => setValue("—"));
  }, []);
  return <>{value}</>;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("ar-MA").format(n);
}

export default HomeHero;
