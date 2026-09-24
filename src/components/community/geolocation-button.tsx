"use client";

// ===================================================================
//  GeolocationButton — زر "📍 حدّد موقعي"
//  - يستعمل navigator.geolocation.getCurrentPosition()
//  - يحاول إيجاد أقرب حيّ على خريطة مراكش
//  - يُظهر اقتراحاً: "اقتراح: أنت في مقاطعة [المنطقة الأقرب]. انضم الآن؟"
//  - معالجة الأخطاء: إذن مرفوض / غير مدعوم / انتهاء المهلة
//  - يحفظ الاختيار في localStorage
// ===================================================================

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, ArrowLeft, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface GeolocationDistrictRef {
  slug: string;
  nameAr: string;
  nameFr: string;
  /** إحداثيات مركز الحيّ على شبكة الخريطة (viewBox 0..400) */
  centerX: number;
  centerY: number;
}

interface GeolocationButtonProps {
  /** قائمة الأحياء المتاحة للاقتراح (المُقاربة الوحيدة لمركز مراكش) */
  districts: GeolocationDistrictRef[];
  /** className إضافي */
  className?: string;
}

// مراكش مركز تقريبي: خط العرض 31.6295، خط الطول -7.9811
// نُطبّق إحداثيات GPS على شبكة 400×400 (مراكش ~50×50 km)
// المركز (200, 200) = (31.6295, -7.9811)
// كل 1° ~ 110 km — مراكش تغطّي ~50km → ~0.45° في كل اتجاه
// نُطبّق: x = 200 + (lat - 31.6295) * 200 / 0.225  (مقلوب)
//         y = 200 - (lng - (-7.9811)) * 200 / 0.225
// (y معكوس لأن الشمال = أعلى الخريطة)

const MARRAKECH_CENTER = { lat: 31.6295, lng: -7.9811 };
const MARRAKECH_HALF_DEGREE = 0.225; // ~25km

function gpsToSvg(lat: number, lng: number): { x: number; y: number } {
  const x = 200 + ((lat - MARRAKECH_CENTER.lat) / MARRAKECH_HALF_DEGREE) * 200;
  const y = 200 - ((lng - MARRAKECH_CENTER.lng) / MARRAKECH_HALF_DEGREE) * 200;
  return { x, y };
}

function nearestDistrict(
  pos: { x: number; y: number },
  districts: GeolocationDistrictRef[]
): GeolocationDistrictRef | null {
  if (districts.length === 0) return null;
  let best: GeolocationDistrictRef | null = null;
  let bestDist = Infinity;
  for (const d of districts) {
    const dx = d.centerX - pos.x;
    const dy = d.centerY - pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  return best;
}

type Status =
  | "idle"
  | "locating"
  | "denied"
  | "no-support"
  | "timeout"
  | "ok"
  | "outside";

export function GeolocationButton({
  districts,
  className,
}: GeolocationButtonProps) {
  const [status, setStatus] = React.useState<Status>("idle");
  const [userPos, setUserPos] = React.useState<{ x: number; y: number } | null>(
    null
  );
  const [suggested, setSuggested] = React.useState<GeolocationDistrictRef | null>(
    null
  );
  const [dismissed, setDismissed] = React.useState(false);

  const handleLocate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("no-support");
      toast.error("المتصفّح لا يدعم خدمة تحديد الموقع على هذا الجهاز");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const pos = gpsToSvg(latitude, longitude);
        // خارج نطاق مراكش تقريباً؟
        const dx = pos.x - 200;
        const dy = pos.y - 200;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 240) {
          setStatus("outside");
          toast.info(
            "يبدو أنك خارج نطاق مراكش — اختر حيّك يدوياً من الخريطة."
          );
          return;
        }
        setUserPos(pos);
        const near = nearestDistrict(pos, districts);
        if (near) {
          setSuggested(near);
          setStatus("ok");
          try {
            localStorage.setItem("mar-suggested-district", near.slug);
            localStorage.setItem("mar-geo-ts", Date.now().toString());
          } catch {
            // تجاهل
          }
          toast.success(
            `اقتراح: أنت قريب من حيّ «${near.nameAr}» — انضمّ الآن؟`
          );
        } else {
          setStatus("ok");
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
          toast.error("تم رفض إذن الوصول للموقع — يمكنك اختيار الحي يدوياً.");
        } else if (err.code === err.TIMEOUT) {
          setStatus("timeout");
          toast.error("انتهت مهلة تحديد الموقع — حاول مرّة أخرى.");
        } else {
          setStatus("denied");
          toast.error("تعذّر تحديد موقعك الحالي");
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  // استرجاع آخر اقتراح من localStorage عند التحميل
  React.useEffect(() => {
    try {
      const slug = localStorage.getItem("mar-suggested-district");
      if (slug) {
        const found = districts.find((d) => d.slug === slug) ?? null;
        if (found) {
          setSuggested(found);
          // لا نعرض state "ok" — فقط نعرض الاقتراح السابق
        }
      }
    } catch {
      // تجاهل
    }
  }, [districts]);

  return (
    <div className={className}>
      <Button
        type="button"
        onClick={handleLocate}
        variant="outline"
        className="min-h-11 gap-2"
        disabled={status === "locating"}
      >
        <Navigation className="size-4 text-primary" />
        {status === "locating"
          ? "نحدّد موقعك..."
          : status === "denied" || status === "timeout"
            ? "أعد المحاولة"
            : "📍 حدّد موقعي"}
      </Button>

      {/* بطاقة اقتراح */}
      <AnimatePresence>
        {suggested && status !== "locating" && !dismissed && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="mt-3 warm-shadow border-accent/40">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-accent/15 p-2">
                    <MapPin className="size-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">
                      اقتراح: أنت في مقاطعة {suggested.nameAr}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {suggested.nameFr} — انضمّ الآن؟
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button asChild size="sm" className="min-h-11 gap-1.5">
                        <Link href={`/community/districts/${suggested.slug}`}>
                          <ArrowLeft className="size-3.5" />
                          انضمّ لهذا الحي
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="min-h-11"
                        onClick={() => setDismissed(true)}
                      >
                        ليس الآن
                      </Button>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="إغلاق الاقتراح"
                    className="rounded-md p-1 text-muted-foreground hover:bg-accent/30 hover:text-foreground transition-colors"
                    onClick={() => setDismissed(true)}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* مؤشّر موقع المستخدم على الخريطة (إن وُجد) */}
      {userPos && status === "ok" && (
        <MarkerPortal pos={userPos} />
      )}
    </div>
  );
}

/**
 * مؤشّر مرئي لموقع المستخدم على الخريطة
 * (مبسّط: نُرجع svg片段 ليُدخَل داخل svg الخريطة عبر useEffect)
 * في الواقع، يكفي إظهار إحداثيات على البطاقة — الخريطة تُبرز الحي المُقترَح
 */
function MarkerPortal({ pos }: { pos: { x: number; y: number } }) {
  // مكون بسيط — لا يفعل شيئاً على DOM لكنه يحفظ الموقع
  // (الـMarrakechMap يستقبل highlightSlug لإبراز الحي المختار)
  return (
    <span className="sr-only" aria-live="polite">
      موقعك التقريبي على شبكة مراكش: ({pos.x.toFixed(0)}, {pos.y.toFixed(0)})
    </span>
  );
}
