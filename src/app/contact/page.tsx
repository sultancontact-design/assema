// ===================================================================
//  /contact — اتصل بنا
//  Server Component (page) + Client sub-component (form)
//  5 أقسام: معلومات الاتصال، نموذج، خريطة SVG، ساعات العمل، روابط إضافية
// ===================================================================

import type { Metadata } from "next";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  HelpCircle,
  ShieldQuestion,
  LifeBuoy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { ContactForm } from "@/components/community/contact-form";

export const metadata: Metadata = {
  title: "اتصل بنا",
  description:
    "تواصل مع لجنة سيدي يوسف بن علي العاصمة — بريد، هاتف، عنوان بنية مراكش. نموذج رسالة سريع، خرائط، ساعات العمل.",
};

const CONTACT_INFO = [
  {
    icon: Mail,
    label: "البريد الإلكتروني",
    value: "contact@syba-community.ma",
    href: "mailto:contact@syba-community.ma",
    note: "نستجيب خلال 48 ساعة عادةً",
  },
  {
    icon: Phone,
    label: "الهاتف",
    value: "+212 5XX-XXXXXX",
    href: "tel:+2125XXXXXXX",
    note: "للأمور العاجلة (وفاة، طارئ)",
  },
  {
    icon: MapPin,
    label: "العنوان",
    value: "حي سيدي يوسف بن علي الصنهاجي، مراكش، المغرب",
    href: null,
    note: "مكتب اللجنة: نُحدّد موعداً مسبقاً",
  },
];

const EXTRA_LINKS = [
  {
    icon: HelpCircle,
    title: "أسئلة شائعة",
    description: "إجابات على ما يسأله أهل الحيّ كثيراً.",
    href: "/faq",
    cta: "اقرأ الأسئلة",
  },
  {
    icon: ShieldQuestion,
    title: "صندوق الشكاوى",
    description: "شكوى ضدّ عضو، قرار، أو سلوك. سرّية تامّة.",
    href: "/complaints",
    cta: "قدّم شكوى",
  },
  {
    icon: LifeBuoy,
    title: "الدعم الفني",
    description: "مشكل تقني؟ خطأ في الصفحة؟ تواصل معنا فوراً.",
    href: "mailto:tech@syba-community.ma",
    cta: "راسل الدعم",
  },
];

const WORK_HOURS = [
  { day: "الإثنين - الجمعة", time: "9:00 - 18:00" },
  { day: "السبت", time: "9:00 - 13:00" },
  { day: "الأحد", time: "مغلق" },
];

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 space-y-10">
      {/* الرأس */}
      <header className="space-y-3 text-center">
        <Badge
          variant="outline"
          className="bg-secondary/5 text-secondary border-secondary/20"
        >
          <Mail className="size-3" />
          تواصل معنا
        </Badge>
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          اتصل بنا
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          نحن لجنة محلية من سكان حيّ سيدي يوسف بن علي. لا تحتاج لمعرفة اسم
          واحد — نحن أهل الحيّ. تواصل بسهولة عبر النموذج أو الهاتف.
        </p>
      </header>

      <ZelligeDivider variant="stars" />

      {/* 1. معلومات الاتصال */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-foreground">
          معلومات الاتصال
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CONTACT_INFO.map((info) => (
            <Card key={info.label} className="warm-shadow">
              <CardContent className="p-5 space-y-2">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <info.icon className="size-5" />
                </div>
                <h3 className="font-heading text-sm font-bold text-foreground">
                  {info.label}
                </h3>
                {info.href ? (
                  <a
                    href={info.href}
                    dir={info.icon === Phone ? "ltr" : undefined}
                    className="block text-sm text-primary underline underline-offset-2 break-all"
                  >
                    {info.value}
                  </a>
                ) : (
                  <p className="text-sm text-foreground">{info.value}</p>
                )}
                <p className="text-[10px] text-muted-foreground">{info.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <ZelligeDivider variant="wave" />

      {/* 2. نموذج رسالة */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-heading text-xl font-bold text-foreground">
            نموذج رسالة سريع
          </h2>
          <Badge
            variant="outline"
            className="bg-accent/5 text-accent border-accent/20"
          >
            <Clock className="size-3" />
            نردّ خلال 48 ساعة
          </Badge>
        </div>
        <ContactForm />
      </section>

      <ZelligeDivider variant="minimal" />

      {/* 3. خريطة (placeholder SVG) */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-foreground">
          موقعنا على خريطة مراكش
        </h2>
        <Card className="warm-shadow overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-[16/9] bg-gradient-to-br from-secondary/10 via-primary/5 to-accent/10">
              <ContactMapSvg />
              <div className="absolute bottom-4 start-4 rounded-lg border border-border bg-background/90 px-3 py-2 text-xs shadow-sm">
                <p className="font-bold text-foreground">حي سيدي يوسف بن علي</p>
                <p className="text-muted-foreground">الصنهاجي — مراكش، المغرب</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">
          الخريطة توضيحية. للاجتماع الفعلي، يُرجى الاتصال مسبقاً لتحديد موعد.
        </p>
      </section>

      <ZelligeDivider variant="wave" />

      {/* 4. ساعات العمل */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="bg-secondary/5 text-secondary border-secondary/20"
          >
            <Clock className="size-3" />
            ساعات العمل
          </Badge>
          <h2 className="font-heading text-xl font-bold text-foreground">
            متى نكون متاحّين
          </h2>
        </div>
        <Card className="warm-shadow">
          <CardContent className="p-5">
            <ul className="divide-y divide-border">
              {WORK_HOURS.map((row) => (
                <li
                  key={row.day}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <span className="font-medium text-foreground">{row.day}</span>
                  <span
                    className={
                      row.time === "مغلق"
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }
                    dir="ltr"
                  >
                    {row.time}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">
          خارج هذه الساعات، يمكن إرسال رسالة عبر النموذج — نردّ في يوم العمل
          التالي. للأمور الطارئة (وفاة، حادث)، اتّصل هاتفياً 24/7.
        </p>
      </section>

      <ZelligeDivider variant="diamond" />

      {/* 5. روابط إضافية */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-foreground">
          طرق أخرى للتواصل
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {EXTRA_LINKS.map((item) => (
            <Card key={item.title} className="warm-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <item.icon className="size-5" />
                </div>
                <h3 className="font-heading text-sm font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2"
                >
                  {item.cta}
                  <span aria-hidden="true">←</span>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

// -------------------------------------------------------------------
//  خريطة SVG مكانية (placeholder — خرائطية مغربية)
// -------------------------------------------------------------------

function ContactMapSvg() {
  return (
    <svg
      viewBox="0 0 400 225"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 size-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* خلفية شبه خريطة */}
      <rect width="400" height="225" fill="#FBF6EE" opacity="0.6" />

      {/* شبكة شوارع مبسّطة */}
      <g stroke="#C8842A" strokeWidth="1.5" opacity="0.35">
        <line x1="0" y1="40" x2="400" y2="40" />
        <line x1="0" y1="80" x2="400" y2="80" />
        <line x1="0" y1="140" x2="400" y2="140" />
        <line x1="0" y1="180" x2="400" y2="180" />
        <line x1="60" y1="0" x2="60" y2="225" />
        <line x1="150" y1="0" x2="150" y2="225" />
        <line x1="240" y1="0" x2="240" y2="225" />
        <line x1="330" y1="0" x2="330" y2="225" />
      </g>

      {/* منطقة الحي (دائرة مظلّلة) */}
      <circle
        cx="200"
        cy="115"
        r="55"
        fill="#B8492B"
        opacity="0.18"
      />
      <circle
        cx="200"
        cy="115"
        r="55"
        fill="none"
        stroke="#B8492B"
        strokeWidth="2"
        strokeDasharray="4 4"
        opacity="0.5"
      />

      {/* علامة الموقع (نجمة ثمانية) */}
      <g transform="translate(200 115)">
        <circle cx="0" cy="0" r="14" fill="#2D5A3D" />
        <path
          d="M0 -10 L2.5 -3 L10 0 L2.5 3 L0 10 L-2.5 3 L-10 0 L-2.5 -3 Z"
          fill="#C8842A"
        />
        <circle cx="0" cy="0" r="2" fill="#FBF6EE" />
      </g>

      {/* علامات محيطية (مدن مراكش كبيرة) */}
      <g fill="#2D5A3D" opacity="0.6">
        <circle cx="80" cy="60" r="3" />
        <text
          x="86"
          y="63"
          fontSize="9"
          fill="#1F1A17"
          fontFamily="Tajawal, sans-serif"
        >
          جلّيز
        </text>
        <circle cx="320" cy="180" r="3" />
        <text
          x="326"
          y="183"
          fontSize="9"
          fill="#1F1A17"
          fontFamily="Tajawal, sans-serif"
        >
          الدشيرة
        </text>
        <circle cx="350" cy="60" r="3" />
        <text
          x="356"
          y="63"
          fontSize="9"
          fill="#1F1A17"
          fontFamily="Tajawal, sans-serif"
        >
          المدينة القديمة
        </text>
      </g>

      {/* عنوان بصري */}
      <text
        x="200"
        y="30"
        textAnchor="middle"
        fontSize="11"
        fontWeight="bold"
        fill="#B8492B"
        fontFamily="Tajawal, sans-serif"
      >
        مراكش — المغرب
      </text>
    </svg>
  );
}
