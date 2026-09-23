"use client";

// ===================================================================
//  HomeHero — قسم البطل (Hero) مع الأنميشن
//  - خلفية parallax: MoroccanPattern تتحرّك ببطء مع التمرير
//  - عنوان: كل كلمة تظهر مع stagger (framer-motion)
//  - عنوان فرعي: ينزلق بعد العنوان
//  - أزرار CTA: نبض كل 3 ثوانٍ
// ===================================================================

import * as React from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowLeft, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { MoroccanPattern } from "@/components/shared/moroccan-pattern";

const TITLE_WORDS = ["من", "حي", "إلى", "عاصمة..."];

// ─────────── متغيّرات الأنميشن ───────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.15,
    },
  },
};

const wordVariants = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: "easeOut" },
  },
};

const subtitleVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut", delay: 0.9 },
  },
};

const ctaVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut", delay: 1.15 },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut", delay: 0.05 },
  },
};

export function HomeHero() {
  const prefersReduced = useReducedMotion();
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // parallax: تتحرّك الخلفية من 0 إلى -80px خلال تمرير قسم البطل
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);
  // النص يُخفى تدريجياً مع التمرير
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const contentOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.4]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-b border-border hero-gradient"
    >
      {/* ─────────── خلفية زخرفية مع parallax ─────────── */}
      <motion.div
        className="pointer-events-none absolute inset-0 -z-10"
        style={prefersReduced ? undefined : { y: bgY, scale: bgScale }}
        aria-hidden="true"
      >
        <MoroccanPattern
          variant="zellige"
          opacity={0.07}
          className="absolute inset-0"
        />
        <MoroccanPattern
          variant="stars"
          opacity={0.05}
          className="absolute inset-0"
          color="var(--accent)"
          secondaryColor="var(--secondary)"
        />
      </motion.div>

      <div className="container mx-auto px-4 py-16 md:py-24">
        <motion.div
          style={prefersReduced ? undefined : { y: contentY, opacity: contentOpacity }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl mx-auto text-center"
        >
          {/* شارة المنصة */}
          <motion.div variants={badgeVariants}>
            <Badge
              variant="secondary"
              className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 scale-on-hover"
            >
              <Sparkles className="size-3 ms-1.5" />
              <span>منصة المعروف الرقمي</span>
            </Badge>
          </motion.div>

          {/* العنوان — كل كلمة على حدة */}
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground leading-tight mb-4">
            <motion.span
              variants={containerVariants}
              className="inline-flex flex-wrap gap-x-2 gap-y-1 justify-center"
            >
              {TITLE_WORDS.map((w, i) => (
                <motion.span
                  key={i}
                  variants={wordVariants}
                  className="inline-block"
                >
                  {w}
                </motion.span>
              ))}
            </motion.span>
            <br />
            <motion.span
              variants={wordVariants}
              className="text-gradient-zellige inline-block"
            >
              المعروف الرقمي
            </motion.span>
          </h1>

          {/* العنوان الفرعي */}
          <motion.p
            variants={subtitleVariants}
            className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto"
          >
            منصة اجتماعية تضامنية لرقمنة «المعروف المغربي» في حي سيدي يوسف بن
            علي بمراكش. صندوق الأفراح والأتراح، الفعاليات، المجموعات — كلها في
            مكان واحد، بشفافية كاملة وكرامة محفوظة.
          </motion.p>

          {/* أزرار CTA — نبض كل 3 ثوانٍ */}
          <motion.div
            variants={ctaVariants}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-12"
          >
            <motion.div
              animate={
                prefersReduced
                  ? undefined
                  : { scale: [1, 1.04, 1] }
              }
              transition={
                prefersReduced
                  ? undefined
                  : {
                      duration: 1.2,
                      repeat: Infinity,
                      repeatDelay: 1.8,
                      ease: "easeInOut",
                    }
              }
            >
              <Button asChild size="lg" className="h-12 px-8 text-base press-on-active">
                <Link href="/register">
                  <span>انضمّ إلى الحي</span>
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
            </motion.div>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base press-on-active"
            >
              <Link href="/community/fund">
                <Heart className="size-4" />
                <span>تعرّف على الصندوق</span>
              </Link>
            </Button>
          </motion.div>

          <ZelligeDivider variant="diamond" className="opacity-70" />
        </motion.div>
      </div>
    </section>
  );
}
