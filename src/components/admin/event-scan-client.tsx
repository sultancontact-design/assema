"use client";

// ===================================================================
//  event-scan-client.tsx — صفحة مسح QR للحضور (admin)
//  - تبويب 1: "إدخال يدوي" — حقل نصّي + زر إرسال
//  - تبويب 2: "تتبّع الحضور" — قائمة الحاضرين مع التوقيت
//  - بطاقات إحصاءات (إجمالي/حاضر/متبقّي)
//  - يستعمل POST /api/admin/events/scan (XHR fetch)
// ===================================================================

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Users as UsersIcon,
  CalendarCheck,
  CalendarClock,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { formatDateTimeArabic } from "@/lib/constants";
import type { RegistrationStatus } from "@prisma/client";

// ===================================================================
//  الأنواع
// ===================================================================

export interface ScanAttendee {
  id: string;
  ticketCode: string;
  status: RegistrationStatus;
  registeredAt: string;
  attendedAt: string | null;
  user: { id: string; fullName: string };
}

export interface EventScanClientProps {
  // قائمة الفعاليات المتاحة للحضور (PUBLISHED + ONGOING)
  events: Array<{
    id: string;
    title: string;
    startDate: string;
    maxAttendees: number | null;
  }>;
  // التسجيلات المبدئية للفعالية المُختارة (لتبويب "تتبّع الحضور")
  initialAttendees: ScanAttendee[];
  // هل المستخدم super_admin أو district_mod؟
  isStaff: boolean;
}

interface ScanResult {
  ok: boolean;
  status: "success" | "already" | "not_found" | "error";
  message: string;
  attendee?: {
    fullName: string;
    ticketCode: string;
    attendedAt: string;
    eventTitle?: string;
  };
}

// ===================================================================
//  المكوّن
// ===================================================================

export function EventScanClient({
  events,
  initialAttendees,
}: EventScanClientProps) {
  const router = useRouter();
  const [ticketCode, setTicketCode] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<ScanResult | null>(null);
  const [attendees, setAttendees] =
    React.useState<ScanAttendee[]>(initialAttendees);
  const [search, setSearch] = React.useState("");

  const totalRegistered = attendees.length;
  const totalAttended = attendees.filter((a) => a.status === "ATTENDED").length;
  const remaining = Math.max(0, totalRegistered - totalAttended);

  const handleScan = async (code?: string) => {
    const finalCode = (code ?? ticketCode).trim();
    if (!finalCode) {
      toast.error("أدخل رقم التذكرة أولاً");
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/events/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketCode: finalCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 200 && data.attendee) {
        const r: ScanResult = {
          ok: true,
          status: "success",
          message: "تم تسجيل الحضور بنجاح",
          attendee: {
            fullName: data.attendee.fullName,
            ticketCode: data.attendee.ticketCode,
            attendedAt: data.attendee.attendedAt,
            eventTitle: data.event?.title,
          },
        };
        setResult(r);
        toast.success(r.message);
        // إضافة/تحديث الحاضر في القائمة
        setAttendees((prev) => {
          const existing = prev.find(
            (a) => a.ticketCode.toLowerCase() === finalCode.toLowerCase()
          );
          if (existing) {
            return prev.map((a) =>
              a.id === existing.id
                ? {
                    ...a,
                    status: "ATTENDED" as RegistrationStatus,
                    attendedAt: data.attendee.attendedAt,
                  }
                : a
            );
          }
          // تذكرة من فعالية أخرى — أضفها للقائمة
          return [
            {
              id: data.attendee.id,
              ticketCode: data.attendee.ticketCode,
              status: "ATTENDED" as RegistrationStatus,
              registeredAt: data.attendee.registeredAt,
              attendedAt: data.attendee.attendedAt,
              user: {
                id: data.attendee.userId,
                fullName: data.attendee.fullName,
              },
            },
            ...prev,
          ];
        });
        setTicketCode("");
      } else if (res.status === 409) {
        // سبق تسجيل الحضور
        const r: ScanResult = {
          ok: false,
          status: "already",
          message: data.error ?? "تم تسجيل الحضور مسبقاً",
          attendee: data.attendee
            ? {
                fullName: data.attendee.fullName,
                ticketCode: data.attendee.ticketCode,
                attendedAt: data.attendee.attendedAt,
                eventTitle: data.event?.title,
              }
            : undefined,
        };
        setResult(r);
        toast.warning(r.message);
      } else if (res.status === 404) {
        const r: ScanResult = {
          ok: false,
          status: "not_found",
          message: data.error ?? "رقم التذكرة غير موجود",
        };
        setResult(r);
        toast.error(r.message);
      } else {
        const r: ScanResult = {
          ok: false,
          status: "error",
          message: data.error ?? "حدث خطأ غير متوقّع",
        };
        setResult(r);
        toast.error(r.message);
      }
    } catch {
      const r: ScanResult = {
        ok: false,
        status: "error",
        message: "تعذّر الاتصال بالخادم",
      };
      setResult(r);
      toast.error(r.message);
    } finally {
      setSubmitting(false);
      router.refresh();
    }
  };

  const filteredAttendees = attendees.filter(
    (a) =>
      a.user.fullName.toLowerCase().includes(search.toLowerCase().trim()) ||
      a.ticketCode.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="space-y-6">
      {/* رأس */}
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl flex items-center gap-2">
          <ScanLine className="size-7 text-primary" />
          مسح QR لتسجيل الحضور
        </h1>
        <p className="text-sm text-muted-foreground">
          أدخل رقم تذكرة الحضور (مثال: EV-2024-001) لتسجيل حضور المشارك.
          يمكنك أيضاً تتبّع الحاضرين وعددهم في تبويب "تتبّع الحضور".
        </p>
      </header>

      {/* إحصاءات */}
      <div className="grid grid-cols-3 gap-3">
        <StatBox
          label="إجمالي المسجّلين"
          value={totalRegistered}
          icon={<UsersIcon className="size-5" />}
          color="text-primary"
        />
        <StatBox
          label="حضروا"
          value={totalAttended}
          icon={<CalendarCheck className="size-5" />}
          color="text-emerald-600"
        />
        <StatBox
          label="متبقّي"
          value={remaining}
          icon={<CalendarClock className="size-5" />}
          color="text-amber-600"
        />
      </div>

      <Tabs defaultValue="manual" className="space-y-4">
        <TabsList className="h-11">
          <TabsTrigger value="manual" className="text-sm">
            <ScanLine className="size-4" />
            إدخال يدوي
          </TabsTrigger>
          <TabsTrigger value="track" className="text-sm">
            <UsersIcon className="size-4" />
            تتبّع الحضور
          </TabsTrigger>
        </TabsList>

        {/* تبويب الإدخال اليدوي */}
        <TabsContent value="manual" className="space-y-4">
          <Card className="warm-shadow">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="ticket" className="text-sm font-medium text-foreground">
                  رقم التذكرة
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="ticket"
                    value={ticketCode}
                    onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !submitting) {
                        handleScan();
                      }
                    }}
                    placeholder="EV-2024-001"
                    className="h-12 font-mono text-lg"
                    autoFocus
                    aria-label="رقم التذكرة"
                  />
                  <Button
                    onClick={() => handleScan()}
                    disabled={submitting || !ticketCode.trim()}
                    size="lg"
                    className="h-12 sm:min-w-[140px]"
                  >
                    <Send className="size-4" />
                    {submitting ? "جاري..." : "تحقّق"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  اضغط Enter للإرسال المباشر
                </p>
              </div>

              {/* نتيجة المسح */}
              <AnimatePresence mode="wait">
                {result && (
                  <motion.div
                    key={`${result.status}-${result.attendee?.ticketCode ?? "0"}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ScanResultCard result={result} />
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* الفعاليات المتاحة */}
          {events.length > 0 && (
            <Card className="warm-shadow">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  فعاليات مفتوحة للحضور
                </p>
                <div className="flex flex-wrap gap-2">
                  {events.map((ev) => (
                    <Badge
                      key={ev.id}
                      variant="outline"
                      className="bg-muted text-muted-foreground"
                    >
                      {ev.title}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* تبويب تتبّع الحضور */}
        <TabsContent value="track" className="space-y-4">
          <Card className="warm-shadow">
            <CardContent className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو رقم التذكرة..."
                  className="h-11 ps-9"
                  aria-label="بحث"
                />
              </div>

              {filteredAttendees.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  لا توجد تسجيلات مطابقة.
                </div>
              ) : (
                <div className="max-h-[480px] overflow-y-auto custom-scrollbar -mx-1 px-1">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 sticky top-0 z-10">
                      <tr>
                        <th className="text-start font-medium text-muted-foreground p-2.5">
                          الاسم
                        </th>
                        <th className="text-start font-medium text-muted-foreground p-2.5">
                          التذكرة
                        </th>
                        <th className="text-start font-medium text-muted-foreground p-2.5">
                          الحالة
                        </th>
                        <th className="text-start font-medium text-muted-foreground p-2.5 hidden sm:table-cell">
                          وقت الحضور
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendees.map((a) => {
                        const isAttended = a.status === "ATTENDED";
                        const statusBadge = isAttended
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : a.status === "REGISTERED"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : a.status === "NO_SHOW"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-slate-100 text-slate-800 border-slate-200";
                        return (
                          <tr
                            key={a.id}
                            className="border-t border-border hover:bg-muted/20"
                          >
                            <td className="p-2.5">
                              <div className="flex items-center gap-2">
                                <Avatar className="size-8">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {a.user.fullName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-foreground">
                                  {a.user.fullName}
                                </span>
                              </div>
                            </td>
                            <td className="p-2.5 font-mono text-xs text-muted-foreground">
                              {a.ticketCode}
                            </td>
                            <td className="p-2.5">
                              <Badge
                                className={statusBadge}
                                variant="outline"
                              >
                                {isAttended ? (
                                  <>
                                    <CheckCircle2 className="size-3" />
                                    حاضر
                                  </>
                                ) : (
                                  "بانتظار"
                                )}
                              </Badge>
                            </td>
                            <td className="p-2.5 text-xs text-muted-foreground hidden sm:table-cell">
                              {a.attendedAt
                                ? formatDateTimeArabic(a.attendedAt)
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ZelligeDivider variant="minimal" />

      <p className="text-center text-xs text-muted-foreground">
        💡 نصيحة: في بيئة الإنتاج، يمكن تفعيل مسح الكاميرا مباشرة عبر مكتبة
        مثل `html5-qrcode`. هنا نُوفّر الإدخال اليدوي لتفادي قيود iframe.
      </p>
    </div>
  );
}

// ===================================================================
//  بطاقة إحصاء
// ===================================================================

function StatBox({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <Card className="warm-shadow">
      <CardContent className="p-3 sm:p-4 space-y-1 text-center">
        <div
          className={`flex items-center justify-center gap-1.5 ${color ?? ""}`}
        >
          {icon}
          <span className="text-[11px] sm:text-xs text-muted-foreground">
            {label}
          </span>
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-foreground">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

// ===================================================================
//  بطاقة نتيجة المسح
// ===================================================================

function ScanResultCard({ result }: { result: ScanResult }) {
  if (result.status === "success" && result.attendee) {
    return (
      <Card className="warm-shadow border-emerald-300 bg-emerald-50/70">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-7 text-emerald-600" />
            <div>
              <p className="font-heading text-lg font-bold text-emerald-800">
                تم تسجيل الحضور
              </p>
              <p className="text-xs text-emerald-700">
                {formatDateTimeArabic(result.attendee.attendedAt)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg border border-emerald-200 bg-white p-2">
              <p className="text-xs text-muted-foreground">الاسم</p>
              <p className="font-bold text-foreground">
                {result.attendee.fullName}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-white p-2">
              <p className="text-xs text-muted-foreground">رقم التذكرة</p>
              <p className="font-mono font-bold text-foreground">
                {result.attendee.ticketCode}
              </p>
            </div>
            {result.attendee.eventTitle && (
              <div className="rounded-lg border border-emerald-200 bg-white p-2 sm:col-span-2">
                <p className="text-xs text-muted-foreground">الفعالية</p>
                <p className="font-medium text-foreground">
                  {result.attendee.eventTitle}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (result.status === "already" && result.attendee) {
    return (
      <Card className="warm-shadow border-amber-300 bg-amber-50/70">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-7 text-amber-600" />
            <div>
              <p className="font-heading text-lg font-bold text-amber-800">
                تم تسجيل الحضور مسبقاً
              </p>
              <p className="text-xs text-amber-700">
                {formatDateTimeArabic(result.attendee.attendedAt)}
              </p>
            </div>
          </div>
          <div className="text-sm">
            <p className="text-foreground">
              الاسم:{" "}
              <span className="font-bold">
                {result.attendee.fullName}
              </span>
            </p>
            <p className="text-foreground font-mono">
              {result.attendee.ticketCode}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (result.status === "not_found") {
    return (
      <Card className="warm-shadow border-rose-300 bg-rose-50/70">
        <CardContent className="p-5 flex items-center gap-3">
          <XCircle className="size-7 text-rose-600 shrink-0" />
          <div>
            <p className="font-heading text-lg font-bold text-rose-800">
              رقم التذكرة غير موجود
            </p>
            <p className="text-sm text-rose-700">
              تحقّق من الرقم وحاول مجدّداً. إن استمرّ الخطأ، تواصل مع المنظِّم.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="warm-shadow border-rose-300 bg-rose-50/70">
      <CardContent className="p-5 flex items-center gap-3">
        <XCircle className="size-7 text-rose-600 shrink-0" />
        <div>
          <p className="font-heading text-lg font-bold text-rose-800">
            خطأ
          </p>
          <p className="text-sm text-rose-700">{result.message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
