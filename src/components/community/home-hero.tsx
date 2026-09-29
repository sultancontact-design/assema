"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowUpRight, Sparkles, TrendingUp, Users, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ===================================================================
//  HomeHero v59.0 — 2026 Aurora + Glass Split Layout
//  - Aurora gradient background (replacing dark unsplash photo)
//  - Glass-strong KPI card on the left (RTL) with live counters
//  - Display typography (clamp 2.5rem → 5rem)
//  - Staggered motion animation (one coordinated load)
//  - Bento-style: 7/5 columns (content + KPI card)
// ===================================================================

export function HomeHero() {
  const prefersReduced = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
    },
  };

  return (
    <section
      className="relative overflow-hidden border-b border-border"
      aria-labelledby="hero-heading"
    >
      {/* Aurora gradient background — 2026 trend */}
      <div className="absolute inset-0 z-0 gradient-aurora" aria-hidden />
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />
      {/* Soft top vignette for readability */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/30 via-background/10 to-background/60" aria-hidden />

      {/* 7/5 Split layout (RTL: content right, KPI left) */}
      <div className="relative z-10 container-fluid py-16 md:py-24 lg:py-28">
        <motion.div
          variants={prefersReduced ? undefined : containerVariants}
          initial={prefersReduced ? "visible" : "hidden"}
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
        >
          {/* Main content — 7 columns */}
          <div className="lg:col-span-7 max-w-2xl">
            <motion.div variants={prefersReduced ? undefined : itemVariants}>
              <Badge variant="outline" className="glass border-border/60 text-foreground mb-5">
                <Sparkles className="size-3 me-1 text-primary" />
                منصة المعروف الرقمي · مراكش
              </Badge>
            </motion.div>

            <motion.h1
              variants={prefersReduced ? undefined : itemVariants}
              id="hero-heading"
              className="font-heading font-extrabold text-foreground text-display"
            >
              من حيّ إلى عاصمة
              <br />
              <span className="text-primary">المعروف الرقمي</span>
            </motion.h1>

            <motion.p
              variants={prefersReduced ? undefined : itemVariants}
              className="mt-6 text-base md:text-lg text-muted-foreground leading-[1.7] max-w-xl"
            >
              منصة تضامنية تجمع أسر حيّ سيدي يوسف بن علي بمراكش على الخير
              والعطاء — صندوق معروف رقمي، فعاليات، خدمات، وأسعار سوق شفّافة.
            </motion.p>

            <motion.div
              variants={prefersReduced ? undefined : itemVariants}
              className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3"
            >
              <Button asChild size="lg" className="btn-shine h-12 px-6 text-base font-semibold bg-primary hover:bg-primary/90 border-0 text-primary-foreground">
                <Link href="/community">
                  انضمّ إلى الحيّ
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="glass h-12 px-6 text-base border-border/60 hover:bg-background/30">
                <Link href="/community/fund">
                  تعرّف على الصندوق
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Glass KPI Card — 5 columns */}
          <motion.div
            variants={prefersReduced ? undefined : itemVariants}
            className="lg:col-span-5 lg:col-start-8"
          >
            <div className="glass-strong rounded-3xl p-6 md:p-7 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <TrendingUp className="size-3.5 text-emerald-500" />
                  صندوق المعروف — الإجمالي المُؤكَّد
                </span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  مباشر
                </span>
              </div>
              <div className="font-heading font-extrabold text-foreground tabular-nums" style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)" }}>
                <LiveFundTotal />
                <span className="text-base font-medium text-muted-foreground ms-2">د.م</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                مُحدَّث لحظياً من قاعدة البيانات
              </div>

              <div className="mt-6 pt-6 border-t border-border/40 grid grid-cols-3 gap-3">
                <KpiMini icon={Users} label="الأسر" value={<LiveFamiliesCount />} />
                <KpiMini icon={CalendarDays} label="فعاليات" value={<LiveEventsCount />} />
                <KpiMini icon={Sparkles} label="المساهمات" value={<LiveContribCount />} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function KpiMini({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
        <Icon className="size-3 text-primary" />
        {label}
      </div>
      <div className="font-heading font-bold text-lg text-foreground tabular-nums">
        {value}
      </div>
    </div>
  );
}

// ===================================================================
//  Live counters — fetch from /api/public/stats
// ===================================================================
function LiveFundTotal() {
  const [value, setValue] = React.useState<string>("— —");
  React.useEffect(() => {
    fetch("/api/public/stats")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.contributionsTotal === "number") {
          setValue(new Intl.NumberFormat("ar-MA").format(d.contributionsTotal));
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

function LiveContribCount() {
  const [value, setValue] = React.useState<number | string>("—");
  React.useEffect(() => {
    fetch("/api/public/stats")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.contributions === "number") setValue(d.contributions);
      })
      .catch(() => setValue("—"));
  }, []);
  return <>{value}</>;
}

export default HomeHero;
