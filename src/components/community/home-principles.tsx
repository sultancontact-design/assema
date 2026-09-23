"use client";

// ===================================================================
//  HomePrinciples — شبكة المبادئ الخمسة مع أنميشن الدخول
//  - كل بطاقة تظهر مع stagger (whileInView)
//  - lift-on-hover + card-glow للتفاعل
//  - الأيقونات معرّفة هنا مباشرة (لا تُمرَّر عبر server boundary)
// ===================================================================

import * as React from "react";
import { motion } from "framer-motion";
import { Heart, ShieldCheck, TrendingUp, MapPin, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Principle {
  icon: LucideIcon;
  title: string;
  description: string;
}

// المبادئ معرّفة هنا مباشرة لأن الأيقونات (مكوّنات React) لا تُمرَّر عبر server boundary
const PRINCIPLES: Principle[] = [
  {
    icon: Heart,
    title: "الكرامة أولاً",
    description:
      "لا نكشف أسماء المستفيدين في العلن. كل طلب يُعالج بحفظ الكرامة والسرية.",
  },
  {
    icon: ShieldCheck,
    title: "الشفافية الكاملة",
    description:
      "لوحة عامة تُظهر إجمالي المساهمات والصرف والرصيد. كل درهم له إيصال رقمي.",
  },
  {
    icon: TrendingUp,
    title: "الاستدامة",
    description:
      "نبدأ مجاناً 100%، نُثبت الفكرة، ثم ننتقل للمدفوع بعد تحقيق مؤشرات النجاح.",
  },
  {
    icon: MapPin,
    title: "من حي إلى عاصمة",
    description:
      "نبدأ بسيدي يوسف بن علي، ثم نتوسّع لأحياء مراكش أخرى، ثم لمدن المغرب.",
  },
  {
    icon: Sparkles,
    title: "المعروف المغربي",
    description:
      "رقمنة صندوق الأفراح والأتراح التقليدي بروح الجماعة والدّين المتين.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function HomePrinciples() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      {PRINCIPLES.map((p, idx) => {
        const Icon = p.icon;
        return (
          <motion.div
            key={p.title}
            variants={itemVariants}
            className={idx === 0 ? "md:col-span-2 lg:col-span-1" : ""}
          >
            <Card className="h-full warm-shadow card-glow border-border lift-on-hover">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-3">
                  <motion.span
                    whileHover={{ rotate: 8, scale: 1.08 }}
                    transition={{ type: "spring", stiffness: 280, damping: 12 }}
                    className="grid place-items-center size-10 rounded-lg bg-primary/10 text-primary shrink-0"
                  >
                    <Icon className="size-5" />
                  </motion.span>
                  <h3 className="font-heading font-bold text-lg text-foreground leading-tight mt-1">
                    {p.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {p.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
