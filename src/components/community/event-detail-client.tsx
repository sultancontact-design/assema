"use client";

// ===================================================================
//  event-detail-client.tsx — تفاعلات صفحة تفاصيل الفعالية
//  - زر "سجّل الآن" (POST /api/community/events/[id]/register)
//  - زر "إلغاء التسجيل" مع تأكيد (POST /api/community/events/[id]/cancel)
//  - بطاقة التذكرة مع QR + رقم التذكرة
//  - زر "تنزيل التذكرة" (يفعّل print أو يحفظ صورة QR)
// ===================================================================

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Ticket,
  CheckCircle2,
  XCircle,
  Download,
  Calendar,
  MapPin,
  QrCode as QrIcon,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { REGISTRATION_STATUS_LABELS } from "@/lib/constants";
import type { RegistrationStatus } from "@prisma/client";

export interface EventDetailClientProps {
  eventId: string;
  eventTitle: string;
  eventDateLabel: string;
  eventLocation: string;
  // هل التسجيل مفتوح للمستخدم الحالي؟ (event.isRegistrationOpen + الحالة تسمح)
  registrationOpen: boolean;
  // هل المقاعد ممتلئة؟
  seatsFull: boolean;
  // هل المستخدم مسجّل بفعالية (REGISTERED أو ATTENDED)؟
  isRegistered: boolean;
  // بيانات تسجيل المستخدم (إن وُجدت) — تُمرَّر من الـserver
  registration: {
    ticketCode: string;
    status: RegistrationStatus;
    qrDataUrl: string; // PNG data URL
  } | null;
}

export function EventDetailClient(props: EventDetailClientProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState<"register" | "cancel" | null>(null);

  const handleRegister = async () => {
    setSubmitting("register");
    try {
      const res = await fetch(`/api/community/events/${props.eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "فشل التسجيل");
      }
      toast.success("تم تسجيلك بنجاح! احتفظ بتذكرة الحضور.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ أثناء التسجيل");
    } finally {
      setSubmitting(null);
    }
  };

  const handleCancel = async () => {
    setSubmitting("cancel");
    try {
      const res = await fetch(`/api/community/events/${props.eventId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "فشل إلغاء التسجيل");
      }
      toast.success("تم إلغاء تسجيلك");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ أثناء الإلغاء");
    } finally {
      setSubmitting(null);
    }
  };

  const handleDownloadTicket = () => {
    // نُفعّل نافذة الطباعة — المستخدم يختار "حفظ كـ PDF"
    window.print();
  };

  const handleSaveQr = () => {
    if (!props.registration?.qrDataUrl) return;
    try {
      const link = document.createElement("a");
      link.href = props.registration.qrDataUrl;
      link.download = `تذكرة-${props.registration.ticketCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("تم تنزيل رمز QR");
    } catch {
      toast.error("تعذّر تنزيل رمز QR");
    }
  };

  // ----- حالة "أنتم مسجّلون" + تذكرة -----
  if (props.isRegistered && props.registration) {
    const status = props.registration.status as RegistrationStatus;
    const statusLabel = REGISTRATION_STATUS_LABELS[status] ?? status;
    const isAttended = status === "ATTENDED";

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        {/* شارة الحالة */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
            <CheckCircle2 className="size-4" />
            {isAttended ? "تم تسجيل حضورك" : "أنت مسجّل"}
          </Badge>
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            {statusLabel}
          </Badge>
        </div>

        {/* بطاقة التذكرة */}
        <Card className="warm-shadow overflow-hidden">
          {/* ترويسة التذكرة */}
          <div className="bg-primary text-primary-foreground p-4 text-center">
            <p className="text-xs opacity-90">تذكرة الحضور الرسمية</p>
            <p className="text-sm font-semibold mt-0.5">سيدي يوسف بن علي العاصمة</p>
          </div>

          <CardContent className="p-6 space-y-5">
            {/* عنوان الفعالية + رقم التذكرة */}
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">الفعالية</p>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  {props.eventTitle}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="size-3" />
                    التاريخ
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {props.eventDateLabel}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="size-3" />
                    المكان
                  </p>
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {props.eventLocation}
                  </p>
                </div>
              </div>
            </div>

            <ZelligeDivider variant="minimal" />

            {/* رقم التذكرة + QR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* رقم التذكرة */}
              <div className="text-center sm:text-start">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5 justify-center sm:justify-start">
                  <Ticket className="size-3" />
                  رقم التذكرة
                </p>
                <p className="text-2xl font-bold text-primary font-mono tracking-wider break-all">
                  {props.registration.ticketCode}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  احتفظ بهذا الرقم للتحقّق من حضورك في يوم الفعالية.
                </p>
              </div>

              {/* رمز QR */}
              {props.registration.qrDataUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-lg border-2 border-primary/20 bg-white p-2">
                    <img
                      src={props.registration.qrDataUrl}
                      alt="رمز QR للتذكرة"
                      width={160}
                      height={160}
                      className="size-40"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <QrIcon className="size-3" />
                    امسح الرمز عند الدخول
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center size-40 rounded-lg border border-dashed border-border text-muted-foreground">
                  <QrIcon className="size-8" />
                </div>
              )}
            </div>

            {/* أزرار */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleDownloadTicket}
                variant="default"
                size="lg"
                className="h-12 flex-1"
              >
                <Printer className="size-4" />
                تنزيل التذكرة
              </Button>
              <Button
                onClick={handleSaveQr}
                variant="outline"
                size="lg"
                className="h-12 flex-1"
              >
                <Download className="size-4" />
                حفظ رمز QR
              </Button>
              {!isAttended && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-12 flex-1 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                    >
                      <XCircle className="size-4" />
                      إلغاء التسجيل
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>تأكيد إلغاء التسجيل</AlertDialogTitle>
                      <AlertDialogDescription>
                        هل أنت متأكد من إلغاء تسجيلك في «{props.eventTitle}»؟
                        يمكن إعادة التسجيل لاحقاً إن كانت المقاعد متاحة.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="h-11">تراجع</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancel}
                        disabled={submitting === "cancel"}
                        className="h-11 bg-rose-600 hover:bg-rose-700 text-white"
                      >
                        {submitting === "cancel" ? "جاري الإلغاء..." : "نعم، ألغِ التسجيل"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ----- حالة "يمكن التسجيل" -----
  if (props.registrationOpen && !props.seatsFull) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="warm-shadow border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center space-y-3">
            <Ticket className="size-10 mx-auto text-primary" />
            <h3 className="font-heading text-lg font-bold text-foreground">
              سجّل الآن وكن من المشاركين
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              التسجيل مجاني. ستستقبل تذكرة رقمية مع رمز QR للحضور في يوم
              الفعالية.
            </p>
            <Button
              onClick={handleRegister}
              disabled={submitting === "register"}
              size="lg"
              className="h-12 min-w-[200px] mt-2"
            >
              <Ticket className="size-4" />
              {submitting === "register" ? "جاري التسجيل..." : "سجّل الآن"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ----- حالة "المقاعد ممتلئة" -----
  if (props.seatsFull) {
    return (
      <Card className="warm-shadow border-rose-200 bg-rose-50/50">
        <CardContent className="p-6 text-center space-y-2">
          <XCircle className="size-10 mx-auto text-rose-500" />
          <h3 className="font-heading text-lg font-bold text-foreground">
            المقاعد ممتلئة
          </h3>
          <p className="text-sm text-muted-foreground">
            عذراً، اكتمل العدد. نتمنّى أن نراكم في الفعالية القادمة بإذن الله.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ----- الحالة الافتراضية: التسجيل مغلق -----
  return (
    <Card className="warm-shadow">
      <CardContent className="p-6 text-center space-y-2">
        <Ticket className="size-10 mx-auto text-muted-foreground" />
        <h3 className="font-heading text-lg font-bold text-foreground">
          التسجيل مغلق
        </h3>
        <p className="text-sm text-muted-foreground">
          انتهى التسجيل على هذه الفعالية أو لم يُفتح بعد.
        </p>
      </CardContent>
    </Card>
  );
}
