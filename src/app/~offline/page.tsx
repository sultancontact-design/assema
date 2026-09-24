import Link from "next/link";
import { WifiOff, Heart, CalendarDays, Users, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { RetryButton } from "./retry-button";

export const metadata = {
  title: "غير متصل بالإنترنت",
};

/**
 * صفحة /~offline — الصفحة الاحتياطية التي يعرضها الـ Service Worker
 * عند انقطاع الشبكة. تُخدَم مباشرةً من الكاش.
 *
 * ملاحظة: مسار الـ~ مخصّص لـ Serwist (fallbacks.entries).
 */
export default function OfflinePage() {
  const cachedPages = [
    {
      icon: Heart,
      title: "صندوق المعروف",
      description: "الرصيد، آخر المساهمات، والإيصالات المحفوظة.",
      href: "/community/fund",
    },
    {
      icon: CalendarDays,
      title: "الفعاليات",
      description: "الفعاليات القادمة التي سبق تصفّحها.",
      href: "/community/events",
    },
    {
      icon: Users,
      title: "المجموعات",
      description: "مجموعات الحي التي زرتها مؤخّراً.",
      href: "/community/groups",
    },
    {
      icon: MapPin,
      title: "الرئيسية",
      description: "الصفحة الرئيسية والأرقام العامة.",
      href: "/",
    },
  ];

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24">
      <div className="max-w-xl w-full mx-auto text-center">
        {/* الشعار */}
        <div className="flex justify-center mb-8">
          <span className="relative grid place-items-center rounded-2xl bg-primary text-primary-foreground size-20 warm-shadow">
            <svg
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="size-12"
              aria-hidden="true"
            >
              <path
                d="M16 2 L19.5 9.5 L27 6 L23.5 13.5 L31 17 L23.5 20.5 L27 28 L19.5 24.5 L16 31 L12.5 24.5 L5 28 L8.5 20.5 L1 17 L8.5 13.5 L5 6 L12.5 9.5 Z"
                fill="currentColor"
                opacity="0.95"
              />
              <circle cx="16" cy="17" r="3" fill="#C8842A" />
            </svg>
          </span>
        </div>

        <Badge
          variant="outline"
          className="mb-4 text-amber-600 border-amber-500/40 bg-amber-500/5"
        >
          <WifiOff className="size-3 ms-1.5" />
          وضع عدم الاتصال
        </Badge>

        <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground mb-3">
          أنت غير متصل بالإنترنت
        </h1>

        <p className="text-muted-foreground mb-2 leading-relaxed">
          لا بأس — يمكنك تصفّح المحتوى المُخزّن محلياً
        </p>
        <p className="text-sm text-muted-foreground/80 mb-8 leading-relaxed">
          خدمة «المعروف الرقمي» تعمل دون اتصال. كل ما زُرته من قبل متاح لك
          الآن، وستُزامَل البيانات فور عودة الشبكة.
        </p>

        <ZelligeDivider variant="diamond" className="opacity-60 mb-8" />

        {/* زر إعادة المحاولة */}
        <div className="flex justify-center mb-10">
          <RetryButton />
        </div>

        {/* الصفحات المخزّنة */}
        <div className="text-start">
          <p className="text-sm font-medium text-foreground mb-4 text-center">
            الصفحات المتاحة دون اتصال
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cachedPages.map((page) => {
              const Icon = page.icon;
              return (
                <Card
                  key={page.href}
                  className="warm-shadow border-border hover:border-primary/40 transition-colors"
                >
                  <Link href={page.href} className="block h-full">
                    <CardContent className="p-4 flex items-start gap-3">
                      <span className="grid place-items-center size-9 rounded-lg bg-primary/10 text-primary shrink-0">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-heading font-bold text-sm text-foreground">
                          {page.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                          {page.description}
                        </p>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-muted-foreground/70 mt-8 leading-relaxed">
          سيُحاول المتصفّح إعادة الاتصال تلقائياً. ستظهر الإشعارات فور عودة
          الشبكة.
        </p>
      </div>
    </main>
  );
}
