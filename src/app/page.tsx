import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowLeft,
  Heart,
  Users,
  Scale,
  HandCoins,
  ShieldCheck,
  Sparkles,
  CalendarDays,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { getFundStats } from "@/lib/fund-stats";
import { formatNumber } from "@/lib/constants";
import { db } from "@/lib/db";

// Force dynamic — لا نُريد prerender أثناء الـbuild (DB قد لا يكون متاحاً)
export const dynamic = "force-dynamic";
// السماح بالـ ISR لمدّة 60 ثانية على الإحصاءات (آمنة للقراءة)
export const revalidate = 60;

// ===================================================================
//  المكوّن المتدفّق (streamed) — الإحصاءات الحيّة مُغلّفة بـ Suspense
//  parent يُعيد shell ثابت فوراً، والإحصاءات تتدفّق عند جاهزيتها.
// ===================================================================

async function HomeLiveStats() {
  let fundStats = {
    totalContributions: 0,
    balance: 0,
  } as { totalContributions: number; balance: number };
  let familyCount = 0;
  try {
    const [fund, family, user] = await Promise.all([
      getFundStats(),
      db.family.count({ where: { isActive: true, deletedAt: null } }),
      db.user.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    ]);
    fundStats = fund;
    familyCount = family;
    // user موجود لضمان توليد الـ query لكن لم يُعرض هنا
    void user;
  } catch {
    // DB غير متاح — استخدم قيم افتراضية
  }

  const LIVE_STATS = [
    { label: "أسرة مسجّلة", value: formatNumber(familyCount), icon: Users, color: "text-secondary" },
    { label: "درهم مساهم", value: formatNumber(fundStats.totalContributions), icon: HandCoins, color: "text-primary" },
    { label: "درهم الرصيد", value: formatNumber(fundStats.balance), icon: Scale, color: "text-accent" },
  ];

  return (
    <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
      {LIVE_STATS.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="text-center warm-shadow border-border">
            <CardContent className="pt-6 pb-6">
              <Icon className={`size-7 mx-auto mb-2 ${stat.color}`} />
              <div className="font-heading text-3xl font-extrabold text-foreground">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {stat.label}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function HomeLiveStatsSkeleton() {
  return (
    <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto" aria-hidden>
      {[0, 1, 2].map((i) => (
        <Card key={i} className="text-center warm-shadow border-border">
          <CardContent className="pt-6 pb-6">
            <Skeleton className="size-7 mx-auto mb-2 rounded-full" />
            <Skeleton className="h-9 w-2/3 mx-auto mb-2" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const PRINCIPLES = [
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

const AD_PACKAGES = [
  {
    name: "برونزية",
    duration: "شهر",
    placement: "Sidebar",
    price: "300",
    popular: false,
  },
  {
    name: "فضية",
    duration: "شهر",
    placement: "Sidebar + In-feed",
    price: "600",
    popular: false,
  },
  {
    name: "ذهبية",
    duration: "شهر",
    placement: "كل الأماكن",
    price: "1,200",
    popular: true,
  },
  {
    name: "بلاتينية",
    duration: "3 أشهر",
    placement: "كل الأماكن + فعالية",
    price: "3,000",
    popular: false,
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ─────────── قسم البطل (Hero) ─────────── */}
      <section className="relative overflow-hidden border-b border-border">
        {/* خلفية زخرفية خفيفة */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.03] pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #B8492B 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <Badge
              variant="secondary"
              className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
            >
              <Sparkles className="size-3 ms-1.5" />
              <span>منصة المعروف الرقمي</span>
            </Badge>

            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground leading-tight mb-4">
              من حي إلى عاصمة...
              <br />
              <span className="text-primary">المعروف الرقمي</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
              منصة اجتماعية تضامنية لرقمنة «المعروف المغربي» في حي سيدي يوسف بن
              علي بمراكش. صندوق الأفراح والأتراح، الفعاليات، المجموعات — كلها في
              مكان واحد، بشفافية كاملة وكرامة محفوظة.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
              <Button asChild size="lg" className="h-12 px-8 text-base">
                <Link href="/register">
                  <span>انضمّ إلى الحي</span>
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base"
              >
                <Link href="/community/fund">
                  <Heart className="size-4" />
                  <span>تعرّف على الصندوق</span>
                </Link>
              </Button>
            </div>

            <ZelligeDivider variant="diamond" className="opacity-70" />
          </div>

          {/* الأرقام الحيّة — متدفّقة عبر Suspense */}
          <Suspense fallback={<HomeLiveStatsSkeleton />}>
            <HomeLiveStats />
          </Suspense>
        </div>
      </section>

      {/* ─────────── المبادئ ─────────── */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-3 text-secondary border-secondary/30">
            مبادئنا الخمسة
          </Badge>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
            على ماذا نقف؟
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            خمس ركائز بُنيت عليها المنصة، لا نتنازل عنها في أي مرحلة.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PRINCIPLES.map((principle, idx) => {
            const Icon = principle.icon;
            return (
              <Card
                key={principle.title}
                className={`warm-shadow ${
                  idx === 0 ? "md:col-span-2 lg:col-span-1" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="grid place-items-center size-10 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="font-heading font-bold text-lg text-foreground leading-tight mt-1">
                      {principle.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {principle.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ─────────── باقات الإعلانات ─────────── */}
      <section className="bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-accent border-accent/30">
              للراعين والمعلنين
            </Badge>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
              باقات الإعلانات
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              رعِ حيّك وادعم المعروف. كل باقة تشمل موقعاً ومدة محدّدة. الأرباح
              تدعم صندوق المعروف.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {AD_PACKAGES.map((pkg) => (
              <Card
                key={pkg.name}
                className={`relative warm-shadow ${
                  pkg.popular ? "border-primary ring-2 ring-primary/20" : ""
                }`}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-2 inset-x-0 mx-auto w-fit bg-primary text-primary-foreground">
                    الأكثر طلباً
                  </Badge>
                )}
                <CardContent className="p-6 text-center">
                  <h3 className="font-heading text-xl font-bold text-foreground mb-2">
                    {pkg.name}
                  </h3>
                  <div className="my-4">
                    <span className="font-heading text-3xl font-extrabold text-primary">
                      {pkg.price}
                    </span>
                    <span className="text-sm text-muted-foreground ms-1">
                      درهم
                    </span>
                  </div>
                  <dl className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-center gap-1">
                      <dt>المدة:</dt>
                      <dd className="text-foreground font-medium">
                        {pkg.duration}
                      </dd>
                    </div>
                    <div className="flex justify-center gap-1">
                      <dt>الأماكن:</dt>
                      <dd className="text-foreground font-medium">
                        {pkg.placement}
                      </dd>
                    </div>
                  </dl>
                  <Button
                    asChild
                    variant={pkg.popular ? "default" : "outline"}
                    size="sm"
                    className="w-full mt-4"
                  >
                    <Link href="/contact">اطلب الباقة</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── دعوة للانضمام ─────────── */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <Card className="overflow-hidden border-0 maarouf-gradient-soft text-primary-foreground">
          <CardContent className="p-8 md:p-12 text-center">
            <CalendarDays className="size-10 mx-auto mb-4 opacity-90" />
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">
              انضمّ إلى حيّك اليوم
            </h2>
            <p className="opacity-90 max-w-2xl mx-auto mb-6 leading-relaxed">
              إن كنتَ تسكن في حي سيدي يوسف بن علي بمراكش، سجّل حساباً وانضمّ إلى
              مجتمعك الرقمي. مجاناً، بشفافية، وبكرامة.
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="bg-background text-primary hover:bg-background/90"
            >
              <Link href="/register">
                <span>التسجيل المجاني</span>
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
