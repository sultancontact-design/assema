"use client";

// ===================================================================
//  NotificationsClient — صفحة إدارة الإشعارات
//  3 أقسام: إرسال جماعي + قوالب الرسائل + سجل الإرسال
//  + بطاقة إحصاءات
// ===================================================================

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Send,
  Bell,
  Mail,
  Clock,
  CheckCheck,
  Users,
  FileText,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import {
  NOTIFICATION_TYPE_LABELS,
  formatDateTimeArabic,
  formatNumber,
  formatPercent,
} from "@/lib/constants";
import type { NotificationType } from "@prisma/client";

// ===================================================================
//  الأنواع
// ===================================================================

export interface NotificationsData {
  groups: Array<{ id: string; name: string; category: string }>;
  districts: Array<{ id: string; name: string; city: string }>;
  sentHistory: Array<{
    title: string;
    type: string;
    recipientsCount: number;
    isReadCount: number;
    createdAt: string;
  }>;
  stats: {
    totalSent: number;
    totalRead: number;
    readRate: number;
  };
}

// ===================================================================
//  قوالب الرسائل الجاهزة
// ===================================================================

interface MessageTemplate {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const TEMPLATES: MessageTemplate[] = [
  {
    id: "event-invite",
    title: "دعوة لفعالية",
    message:
      "يسعدنا دعوتكم لحضور فعاليتنا القادمة. التفاصيل في صفحة الفعاليات. نتطلّع لرؤيتكم.",
    type: "EVENT",
    icon: FileText,
  },
  {
    id: "contribution-reminder",
    title: "تذكير بالمساهمة",
    message:
      "هذا تذكير ودي بموعد المساهمة الشهرية لصندوق المعروف. مساهمتكم تساهم في دعم الأسر المحتاجة في الحي.",
    type: "CONTRIBUTION",
    icon: MessageSquare,
  },
  {
    id: "general-announcement",
    title: "إعلان عام",
    message:
      "نعلمكم بتحديث مهم في خدمات الحي. يرجى الاطّلاع على التفاصيل في الصفحة الرئيسية للمجتمع.",
    type: "ANNOUNCEMENT",
    icon: Bell,
  },
  {
    id: "fund-request-update",
    title: "تحديث طلب معروف",
    message:
      "تم تحديث حالة طلب المعروف الخاص بكم. يرجى الاطّلاع على التفاصيل عبر الرابط المرفق.",
    type: "FUND_REQUEST",
    icon: FileText,
  },
];

const TYPE_OPTIONS = Object.keys(NOTIFICATION_TYPE_LABELS) as NotificationType[];

// ===================================================================
//  المُكوّن
// ===================================================================

export function NotificationsClient({ data }: { data: NotificationsData }) {
  const [recipientType, setRecipientType] = React.useState<"all" | "group" | "district">("all");
  const [recipientId, setRecipientId] = React.useState<string>("");
  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [type, setType] = React.useState<NotificationType>("ANNOUNCEMENT");
  const [link, setLink] = React.useState("");
  const [scheduleLater, setScheduleLater] = React.useState(false);
  const [scheduledAt, setScheduledAt] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [filterType, setFilterType] = React.useState<string>("ALL");

  function loadTemplate(t: MessageTemplate) {
    setTitle(t.title);
    setMessage(t.message);
    setType(t.type);
    toast.success(`تم تحميل قالب: ${t.title}`);
  }

  function resetForm() {
    setRecipientType("all");
    setRecipientId("");
    setTitle("");
    setMessage("");
    setType("ANNOUNCEMENT");
    setLink("");
    setScheduleLater(false);
    setScheduledAt("");
  }

  async function handleSend() {
    if (!title.trim() || !message.trim()) {
      toast.error("العنوان والرسالة مطلوبان");
      return;
    }
    if (recipientType !== "all" && !recipientId) {
      toast.error("يرجى اختيار المستلم");
      return;
    }
    if (scheduleLater && !scheduledAt) {
      toast.error("يرجى تحديد وقت الإرسال");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientType,
          recipientId: recipientType === "all" ? undefined : recipientId,
          title: title.trim(),
          message: message.trim(),
          type,
          link: link.trim() || undefined,
          scheduledAt: scheduleLater ? new Date(scheduledAt).toISOString() : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "فشل الإرسال");
        return;
      }
      toast.success(`تم إرسال الإشعار إلى ${json.count} مستلم`);
      resetForm();
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  const filteredHistory = React.useMemo(() => {
    if (filterType === "ALL") return data.sentHistory;
    return data.sentHistory.filter((h) => h.type === filterType);
  }, [data.sentHistory, filterType]);

  const recipientCountHint = React.useMemo(() => {
    if (recipientType === "all") return "كل أعضاء الحي الحالي";
    if (recipientType === "group") {
      const g = data.groups.find((x) => x.id === recipientId);
      return g ? `أعضاء مجموعة: ${g.name}` : "اختر مجموعة";
    }
    const d = data.districts.find((x) => x.id === recipientId);
    return d ? `أعضاء حي: ${d.name}` : "اختر حياً";
  }, [recipientType, recipientId, data.groups, data.districts]);

  return (
    <div className="space-y-6">
      {/* بطاقة الإحصاءات */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="border border-border bg-card p-0">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="grid size-10 place-items-center rounded-md bg-accent/10 text-accent">
              <Send className="size-5" strokeWidth={1.5} />
            </span>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">إجمالي المُرسَل</p>
              <p className="font-heading text-xl font-bold text-foreground">
                {formatNumber(data.stats.totalSent)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card p-0">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="grid size-10 place-items-center rounded-md bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
              <CheckCheck className="size-5" strokeWidth={1.5} />
            </span>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">إجمالي المقروء</p>
              <p className="font-heading text-xl font-bold text-foreground">
                {formatNumber(data.stats.totalRead)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card p-0">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="grid size-10 place-items-center rounded-md bg-accent/10 text-accent">
              <Mail className="size-5" strokeWidth={1.5} />
            </span>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">نسبة القراءة</p>
              <p className="font-heading text-xl font-bold text-foreground">
                {formatPercent(data.stats.readRate)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="broadcast" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-muted/40 p-1">
          <TabsTrigger
            value="broadcast"
            className="flex min-h-10 flex-1 items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Send className="size-4" strokeWidth={1.5} />
            <span>إرسال جماعي</span>
          </TabsTrigger>
          <TabsTrigger
            value="templates"
            className="flex min-h-10 flex-1 items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <FileText className="size-4" strokeWidth={1.5} />
            <span>قوالب الرسائل</span>
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex min-h-10 flex-1 items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Clock className="size-4" strokeWidth={1.5} />
            <span>سجل الإرسال</span>
          </TabsTrigger>
        </TabsList>

        {/* ─────────── إرسال جماعي ─────────── */}
        <TabsContent value="broadcast" className="pt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* النموذج */}
            <Card className="border border-border bg-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Send className="size-4 text-accent" strokeWidth={1.5} />
                  <span>نموذج الإرسال الجماعي</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* نوع المستلم */}
                <div className="space-y-1.5">
                  <Label>المستلمون</Label>
                  <Select
                    value={recipientType}
                    onValueChange={(v: "all" | "group" | "district") => {
                      setRecipientType(v);
                      setRecipientId("");
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="اختر نوع المستلم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <span className="flex items-center gap-2">
                          <Users className="size-4" strokeWidth={1.5} />
                          كل الأعضاء
                        </span>
                      </SelectItem>
                      <SelectItem value="group">
                        <span className="flex items-center gap-2">
                          <Users className="size-4" strokeWidth={1.5} />
                          مجموعة محددة
                        </span>
                      </SelectItem>
                      <SelectItem value="district">
                        <span className="flex items-center gap-2">
                          <Users className="size-4" strokeWidth={1.5} />
                          حي محدد
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* المعرف */}
                {recipientType === "group" && (
                  <div className="space-y-1.5">
                    <Label>المجموعة</Label>
                    <Select value={recipientId} onValueChange={setRecipientId}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="اختر مجموعة" />
                      </SelectTrigger>
                      <SelectContent>
                        {data.groups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name} ({g.category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {recipientType === "district" && (
                  <div className="space-y-1.5">
                    <Label>الحي</Label>
                    <Select value={recipientId} onValueChange={setRecipientId}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="اختر حياً" />
                      </SelectTrigger>
                      <SelectContent>
                        {data.districts.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name} ({d.city})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  {recipientCountHint}
                </div>

                {/* النوع */}
                <div className="space-y-1.5">
                  <Label>نوع الإشعار</Label>
                  <Select value={type} onValueChange={(v) => setType(v as NotificationType)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {NOTIFICATION_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* العنوان */}
                <div className="space-y-1.5">
                  <Label htmlFor="notif-title">العنوان</Label>
                  <Input
                    id="notif-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="عنوان قصير ومُعبّر"
                    maxLength={120}
                  />
                </div>

                {/* الرسالة */}
                <div className="space-y-1.5">
                  <Label htmlFor="notif-message">الرسالة</Label>
                  <Textarea
                    id="notif-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="نص الرسالة المُرسَلة للمستلمين"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-end text-[10px] text-muted-foreground">
                    {message.length}/500
                  </p>
                </div>

                {/* الرابط */}
                <div className="space-y-1.5">
                  <Label htmlFor="notif-link">الرابط (اختياري)</Label>
                  <Input
                    id="notif-link"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="/community/events/abc123"
                    dir="ltr"
                  />
                </div>

                {/* الجدولة */}
                <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-3">
                  <div>
                    <Label htmlFor="schedule-toggle" className="text-sm font-medium text-foreground">
                      جدولة لاحقاً
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      عند التعطيل، يُرسَل الإشعار فوراً
                    </p>
                  </div>
                  <Switch
                    id="schedule-toggle"
                    checked={scheduleLater}
                    onCheckedChange={setScheduleLater}
                  />
                </div>

                {scheduleLater && (
                  <div className="space-y-1.5">
                    <Label htmlFor="notif-scheduled">وقت الإرسال</Label>
                    <Input
                      id="notif-scheduled"
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      dir="ltr"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      ملاحظة: الجدولة الفعلية تتطلّب خدمة cron في الإنتاج — يتم تسجيل الإشعار وسنُحاول إرساله عند الوصول للوقت.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={resetForm} className="h-10">
                    إعادة ضبط
                  </Button>
                  <Button onClick={handleSend} disabled={busy} className="h-11">
                    <Send className="size-4" strokeWidth={1.5} />
                    <span>{busy ? "جارٍ الإرسال..." : "إرسال"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* المعاينة */}
            <Card className="border border-border bg-card lg:sticky lg:top-20 lg:self-start">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Bell className="size-4 text-accent" strokeWidth={1.5} />
                  <span>معاينة الإشعار</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 rounded-md border border-border bg-background p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">
                      {NOTIFICATION_TYPE_LABELS[type]}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      الآن
                    </span>
                  </div>
                  <p className="font-medium text-foreground">
                    {title || "عنوان الإشعار يظهر هنا"}
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {message || "نص الرسالة يظهر هنا بشكل كامل."}
                  </p>
                  {link && (
                    <a
                      href="#preview"
                      onClick={(e) => e.preventDefault()}
                      className="inline-block text-xs text-accent hover:underline"
                      dir="ltr"
                    >
                      {link}
                    </a>
                  )}
                  <div className="flex items-center gap-1 border-t border-border pt-2 text-[10px] text-muted-foreground">
                    <Users className="size-3" strokeWidth={1.5} />
                    <span>{recipientCountHint}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─────────── قوالب الرسائل ─────────── */}
        <TabsContent value="templates" className="pt-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((t) => {
              const Icon = t.icon;
              return (
                <Card key={t.id} className="border border-border bg-card p-0">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center gap-2">
                      <span className="grid size-9 place-items-center rounded-md bg-accent/10 text-accent">
                        <Icon className="size-4" strokeWidth={1.5} />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.title}</p>
                        <Badge variant="outline" className="mt-0.5 border-border bg-muted text-muted-foreground text-[10px]">
                          {NOTIFICATION_TYPE_LABELS[t.type]}
                        </Badge>
                      </div>
                    </div>
                    <p className="line-clamp-3 text-xs text-muted-foreground">
                      {t.message}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadTemplate(t)}
                      className="h-9 w-full"
                    >
                      <FileText className="size-4" strokeWidth={1.5} />
                      <span>تحميل في النموذج</span>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ─────────── سجل الإرسال ─────────── */}
        <TabsContent value="history" className="pt-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              آخر {filteredHistory.length} إشعار مُرسَل
            </p>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="فلتر بالنوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الأنواع</SelectItem>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {NOTIFICATION_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="border border-border bg-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-start text-xs text-muted-foreground">العنوان</TableHead>
                      <TableHead className="text-start text-xs text-muted-foreground">النوع</TableHead>
                      <TableHead className="text-start text-xs text-muted-foreground">المستلمون</TableHead>
                      <TableHead className="text-start text-xs text-muted-foreground">المقروء</TableHead>
                      <TableHead className="text-start text-xs text-muted-foreground">التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          لا توجد إشعارات مُرسَلة
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHistory.map((h, i) => (
                        <TableRow key={i} className="text-sm">
                          <TableCell className="font-medium text-foreground">
                            {h.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent text-[10px]">
                              {NOTIFICATION_TYPE_LABELS[h.type as NotificationType] ?? h.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-foreground">
                            {formatNumber(h.recipientsCount)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatNumber(h.isReadCount)}
                            {h.recipientsCount > 0 && (
                              <span className="ms-1 text-[10px]">
                                ({((h.isReadCount / h.recipientsCount) * 100).toFixed(0)}%)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDateTimeArabic(h.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
