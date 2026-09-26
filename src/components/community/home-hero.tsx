"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowLeft, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";

export function HomeHero() {
  const prefersReduced = useReducedMotion();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -80]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.3]);
  const imgScale = useTransform(scrollY, [0, 500], [1, 1.1]);

  return (
    <section className="relative overflow-hidden aurora-bg">
      {/* Full-bleed hero image */}
      <motion.div
        style={prefersReduced ? undefined : { scale: imgScale }}
        className="absolute inset-0 z-0"
      >
        <img
          src="https://images.unsplash.com/photo-1539020140153-e479b8c5e640?auto=format&fit=crop&w=1920&q=80"
          alt="مراكش — المدينة الحمراء"
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.4)" }}
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/50" />
      </motion.div>

      {/* Content */}
      <motion.div
        style={prefersReduced ? undefined : { y: heroY, opacity: heroOpacity }}
        className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Badge className="mb-6 bg-primary/15 text-primary border-primary/30 backdrop-blur-md">
              <Sparkles className="size-3 ms-1.5" />
              <span>منصة المعروف الرقمي</span>
            </Badge>
          </motion.div>

          {/* Title with gradient */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-heading text-4xl sm:text-6xl md:text-7xl font-extrabold leading-tight mb-4"
          >
            <span className="shimmer-text">من حيّ إلى عاصمة</span>
            <br />
            <span className="text-foreground">المعروف الرقمي</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8"
          >
            منصة تضامنية تجمع أسر حيّ سيدي يوسف بن علي بمراكش على الخير والعطاء —
            صندوق معروف رقمي، فعاليات، خدمات، وأسعار سوق شفّافة.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button asChild size="lg" className="btn-premium h-14 px-8 text-base bg-gradient-to-r from-primary to-orange-600 hover:from-orange-600 hover:to-primary border-0">
              <Link href="/community">
                <span>انضمّ إلى الحيّ</span>
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base backdrop-blur-md bg-background/50 border-border/50">
              <Link href="/community/fund">
                <Heart className="size-5" />
                <span>تعرّف على الصندوق</span>
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
}
