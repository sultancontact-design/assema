// ===================================================================
//  /ethics — قيمنا ومبادئنا (v28.0 — REWRITE)
//  ❌ Removed: "تحذير", "إدمان", "خطر", "أذى", emojis
//  ✅ Added: "قيمنا", "مبادئنا", "التزامنا", "رؤيتنا"
//  ✅ Professional language like Stripe/Linear trust pages
// ===================================================================

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import {
  Eye, Settings2, Heart, Shield, Bell, Flame, Gift,
  Users, Clock, ArrowLeft, Sparkles, Lock,
} from "lucide-react";

export const metadata = {
  title: "قيمنا ومبادئنا",
  description: "التزامنا بالشفافية والاحترام والحماية في كل ما نقدّمه لمجتمعنا.",
};

const PRINCIPLES = [
  {
    icon: Eye,
    title: "الشفافية",
    description: "نشرح بوضوح كيف تعمل المنصة، ولماذا. لا أسرار، لا خداع — كل آلية موثّقة هنا.",
  },
  {
    icon: Settings2,
    title: "التحكّم الكامل",
    description: "تتحكّم في كل إشعار وكل تذكير. بإمكانك تعديل كل شيء أو إيقافه من الإعدادات.",
  },
  {
    icon: Heart,
    title: "الاحترام",
    description: "نُصمّم لتجربة مفيدة لا تستهلك وقتك. هدفنا دقائق مفيدة، لا ساعات مهدورة.",
  },
  {
    icon: Shield,
    title: "الحماية",
    description: "كل آلية محفّزاتها تخدم الهدف الأساسي: مساعدة الأسر في حيّك. لا مكافآت فارغة.",
  },
];

const MECHANISMS = [
  {
    icon: Flame,
    title: "السلاسل اليومية",
    purpose: "تُحفّزك على بناء عادة إيجابية — العودة يومياً للمساهمة في صندوق المعروف.",
    why: "العادات تُبنى بالتكرار. سلسلة 7 أيام متتالٍ تُحوّل المساهمة من قرار يومي إلى عادة طبيعية.",
    safeguards: [
      "إمكانية تجميد السلسلة مرّتين مجاناً",
      "إيقاف تنبيهات السلاسل من الإعدادات",
      "استراحة مُجدولة متى شئت",
    ],
  },
  {
    icon: Gift,
    title: "المكافآت المتغيّرة",
    purpose: "مكافآت متنوّعة تُضيف عنصر التشويق الإيجابي لتشجيع المساهمة.",
    why: "التنويع يُحفّز الاهتمام بشكل طبيعي. نستعمله لتشجيع العطاء، لا للاستهلاك.",
    safeguards: [
      "عجلة واحدة يومياً فقط",
      "صندوق مكافآت لكل 5 مساهمات",
      "بدون أموال حقيقية — نقاط معروف فقط",
    ],
  },
  {
    icon: Bell,
    title: "الإشعارات الذكية",
    purpose: "تذكيرات مخصّصة تحترم وقتك وتركيزك.",
    why: "الإشعار المُحسَّن يقلّل الضوضاء ويُبقيك على اطّلاع بما يهمّك فقط.",
    safeguards: [
      "10 أنواع — كلّ قابل للإيقاف",
      "ساعات هدوء قابلة للتخصيص",
      "حدّ يومي أقصى قابل للتعديل",
    ],
  },
  {
    icon: Users,
    title: "الدليل الاجتماعي",
    purpose: "إظهار نشاط المجتمع لتعرف أنّك لست وحدك في العطاء.",
    why: "رؤية 12 عضواً نشطاً الآن تُحفّزك للانضمام بدل تأجيل القرار.",
    safeguards: [
      "لا مقارنات شخصية (أنت أحسن/أسوأ من X)",
      "كل البيانات إجمالية، لا فردية حسّاسة",
      "إمكانية إخفاء الدليل الاجتماعي",
    ],
  },
];

export default function EthicsPage() {
  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-12">
      {/* Hero */}
      <header className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
          <Shield className="size-3" />
          التزامنا الأخلاقي
        </Badge>
        <h1 className="font-heading text-3xl sm:text-5xl font-extrabold">
          <span className="shimmer-text">قيمنا ومبادئنا</span>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          نؤمن أنّ المنصة الجيّدة تُحترم مستخدميها. هذه الصفحة تشرح بصدق
          كيف نُصمّم كل ميزة، ولماذا، وكيف تحتفظ بالتحكّم الكامل في يدك.
        </p>
      </header>

      <ZelligeDivider variant="stars" />

      {/* Principles */}
      <section className="space-y-6">
        <h2 className="font-heading text-2xl font-bold heading-gradient">مبادئنا الأربعة</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map((p, idx) => (
            <div key={p.title} className="premium-card p-6 space-y-3 fade-stagger" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="size-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                <p.icon className="size-5 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-bold">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </section>

      <ZelligeDivider variant="wave" />

      {/* Mechanisms */}
      <section className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold heading-gradient">كيف نُحفّز الانتماء</h2>
          <p className="text-sm text-muted-foreground mt-2">
            لكل ميزة: هدفها، سبب وجودها، وكيف نحميك.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MECHANISMS.map((m, idx) => (
            <div key={m.title} className="premium-card p-6 space-y-4 fade-stagger" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                  <m.icon className="size-5 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-bold">{m.title}</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-primary mb-1">الهدف</p>
                  <p className="text-sm text-foreground">{m.purpose}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-1">لماذا</p>
                  <p className="text-sm text-muted-foreground">{m.why}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-600 mb-1 flex items-center gap-1">
                    <Lock className="size-3" /> ضماناتنا
                  </p>
                  <ul className="space-y-1">
                    {m.safeguards.map((s) => (
                      <li key={s} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="text-emerald-600 mt-0.5">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Button asChild size="sm" variant="outline" className="btn-premium w-full">
                <Link href="/community/notifications/settings">
                  <Settings2 className="size-3.5" />
                  <span>إدارة هذه الميزة</span>
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <ZelligeDivider variant="diamond" />

      {/* Screen time */}
      <section>
        <div className="premium-card p-8 text-center space-y-4">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center mx-auto">
            <Clock className="size-6 text-primary" />
          </div>
          <h2 className="font-heading text-xl font-bold">وقتك ثمين</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            هدفنا أن تقضي هنا 5-10 دقائق يومياً فقط — تكفي لتسجيل الدخول،
            مساهمة بسيطة، وفحص صندوق المعروف. لا نريد منك أكثر من ذلك.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto pt-2">
            <div>
              <p className="stat-number">5-10</p>
              <p className="text-xs text-muted-foreground mt-1">دقائق يومياً (هدفنا)</p>
            </div>
            <div>
              <p className="stat-number">3:42</p>
              <p className="text-xs text-muted-foreground mt-1">وسيط زمن الجلسة</p>
            </div>
            <div>
              <p className="stat-number">8%</p>
              <p className="text-xs text-muted-foreground mt-1">يأخذ استراحة</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 text-primary">
          <Sparkles className="size-5" />
          <h2 className="font-heading text-xl font-bold">التحكّم في يدك</h2>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="btn-premium h-12 px-6 bg-gradient-to-r from-primary to-orange-600 border-0">
            <Link href="/community/notifications/settings">
              <Settings2 className="size-4" />
              <span>إعدادات الإشعارات</span>
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-6 backdrop-blur-md bg-background/50">
            <Link href="/community/hooks">
              <Flame className="size-4" />
              <span>حلقة الانتماء</span>
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
