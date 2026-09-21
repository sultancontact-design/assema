"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ListChecks,
  Download,
  FileSpreadsheet,
  Inbox,
  Calendar,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  formatMAD,
  formatDateTimeArabic,
  CONTRIBUTION_STATUS_LABELS,
  FUND_REQUEST_STATUS_LABELS,
} from "@/lib/constants";
import type { ContributionStatus, FundRequestStatus } from "@prisma/client";

type PeriodKey = "daily" | "weekly" | "monthly" | "yearly";

export interface FundReportsClientProps {
  organization: string;
  periods: {
    daily: PeriodData;
    weekly: PeriodData;
    monthly: PeriodData;
    yearly: PeriodData;
  };
}

interface PeriodData {
  contributionsCount: number;
  contributionsAmount: number;
  requestsCount: number;
  disbursedAmount: number;
  balance: number;
  transactions: {
    date: string;
    type: string;
    reference: string;
    amount: number;
    status: string;
    by: string;
    isContribution: boolean;
  }[];
  monthlySeries: { month: string; contributions: number; disbursed: number }[];
}

const PERIOD_LABELS: Record<PeriodKey, string> = {
  daily: "يومي",
  weekly: "أسبوعي",
  monthly: "شهري",
  yearly: "سنوي",
};

export function FundReportsClient({ organization, periods }: FundReportsClientProps) {
  const [activeTab, setActiveTab] = React.useState<PeriodKey>("daily");
  const [customFrom, setCustomFrom] = React.useState("");
  const [customTo, setCustomTo] = React.useState("");
  const [customData, setCustomData] = React.useState<PeriodData | null>(null);
  const [loadingCustom, setLoadingCustom] = React.useState(false);
  const [downloadingPdf, setDownloadingPdf] = React.useState(false);

  const current = customData ?? periods[activeTab];
  const currentLabel = customData
    ? "نطاق مخصّص"
    : `تقرير ${PERIOD_LABELS[activeTab]}`;

  // عرض البيانات
  const chartData = current.monthlySeries.map((m) => ({
    ...m,
    contributions: Number(m.contributions),
    disbursed: Number(m.disbursed),
  }));

  const handleExportCSV = () => {
    const rows = current.transactions.map((t) => ({
      "التاريخ": formatDateTimeArabic(t.date),
      "النوع": t.type,
      "المرجع": t.reference,
      "المبلغ": t.amount,
      "الحالة":
        t.isContribution
          ? CONTRIBUTION_STATUS_LABELS[t.status as ContributionStatus] ?? t.status
          : (FUND_REQUEST_STATUS_LABELS[t.status as FundRequestStatus]?.label) ?? t.status,
      "بواسطة": t.by,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تقرير الصندوق");
    XLSX.writeFile(wb, `تقرير-الصندوق-${currentLabel}.xlsx`);
    toast.success("تم تصدير التقرير بصيغة CSV");
  };

  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    try {
      const period = customData ? "monthly" : activeTab;
      const params = new URLSearchParams({ period });
      if (customFrom) params.set("from", customFrom);
      if (customTo) params.set("to", customTo);
      const res = await fetch(`/api/fund/reports/${period}/pdf?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "فشل التنزيل");
      }
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `تقرير-الصندوق-${currentLabel}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success("تم تنزيل التقرير PDF بنجاح");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "حدث خطأ أثناء تنزيل الملف"
      );
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCustomRange = async () => {
    if (!customFrom || !customTo) {
      toast.error("اختر تاريخ البداية والنهاية");
      return;
    }
    const from = new Date(customFrom);
    const to = new Date(customTo);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      toast.error("صيغة التاريخ غير صحيحة");
      return;
    }
    if (to < from) {
      toast.error("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");
      return;
    }
    setLoadingCustom(true);
    try {
      const params = new URLSearchParams({
        period: "monthly",
        from: customFrom,
        to: customTo,
      });
      // نُحمّل PDF فقط للحصول على البيانات؟ لا — نُحمّل JSON عبر API آخر
      // لا يوجد API JSON للنطاق المخصص، لذا نعتمد على الفلاتر المحلية
      // سنحمّل بيانات سنوية ثم نُفلتر محلياً
      const res = await fetch(`/api/fund/reports/monthly/pdf?${params}`);
      if (!res.ok) throw new Error("فشل تحميل التقرير");
      // تنزيل الملف مباشرة
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `تقرير-مخصّص-${customFrom}-${customTo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success("تم تنزيل التقرير المخصّص PDF");
      // نُحدّث الحالي ليبقى افتراضياً للجدول
      setCustomData(null);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "حدث خطأ أثناء تحميل التقرير"
      );
    } finally {
      setLoadingCustom(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* نطاق تاريخ مخصّص */}
      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="size-5 text-primary" />
            نطاق مخصّص
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">
                من
              </label>
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">
                إلى
              </label>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-11"
              />
            </div>
            <Button
              onClick={handleCustomRange}
              disabled={loadingCustom}
              className="h-11"
            >
              {loadingCustom ? "جاري..." : "حمّل PDF مخصّص"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as PeriodKey); setCustomData(null); }}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          {(["daily", "weekly", "monthly", "yearly"] as const).map((k) => (
            <TabsTrigger
              key={k}
              value={k}
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2.5"
            >
              <span className="text-xs sm:text-sm">{PERIOD_LABELS[k]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {(["daily", "weekly", "monthly", "yearly"] as const).map((k) => (
          <TabsContent key={k} value={k} className="pt-6">
            <ReportsPeriodContent
              data={periods[k]}
              label={`تقرير ${PERIOD_LABELS[k]}`}
              onExportCSV={handleExportCSV}
              onDownloadPDF={handleDownloadPDF}
              downloadingPdf={downloadingPdf}
              chartData={chartData}
              currentLabel={currentLabel}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ReportsPeriodContent({
  data,
  label,
  onExportCSV,
  onDownloadPDF,
  downloadingPdf,
  chartData,
  currentLabel,
}: {
  data: PeriodData;
  label: string;
  onExportCSV: () => void;
  onDownloadPDF: () => void;
  downloadingPdf: boolean;
  chartData: { month: string; contributions: number; disbursed: number }[];
  currentLabel: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            {label}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {currentLabel} — {data.transactions.length} عملية
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onExportCSV} variant="outline" size="sm" className="h-11">
            <FileSpreadsheet className="size-4" />
            CSV
          </Button>
          <Button
            onClick={onDownloadPDF}
            disabled={downloadingPdf}
            size="sm"
            className="h-11"
          >
            <Download className="size-4" />
            {downloadingPdf ? "جاري..." : "PDF"}
          </Button>
        </div>
      </div>

      {/* بطاقات الإحصاءات */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="warm-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                <ListChecks className="size-4 text-primary" />
                عدد المساهمات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {data.contributionsCount}
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <Card className="warm-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                <ArrowUpCircle className="size-4 text-emerald-600" />
                إجمالي المساهمات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-700">
                {formatMAD(data.contributionsAmount)}
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="warm-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                <ListChecks className="size-4 text-muted-foreground" />
                عدد الطلبات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {data.requestsCount}
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <Card className="warm-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                <ArrowDownCircle className="size-4 text-rose-600" />
                إجمالي الصرف
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-rose-700">
                {formatMAD(data.disbursedAmount)}
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <Card className="warm-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                <Wallet className="size-4 text-primary" />
                الرصيد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${
                  data.balance >= 0 ? "text-foreground" : "text-rose-600"
                }`}
              >
                {formatMAD(data.balance)}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* الرسم البياني */}
      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-5 text-primary" />
            المساهمات مقابل الصرف (12 شهراً)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 20, bottom: 5, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fontFamily: "Tajawal" }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => Number(v).toLocaleString("ar-MA")}
                  width={60}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [formatMAD(value), name]}
                  contentStyle={{
                    fontFamily: "Tajawal",
                    borderRadius: 8,
                  }}
                />
                <Legend wrapperStyle={{ fontFamily: "Tajawal" }} />
                <Line
                  type="monotone"
                  dataKey="contributions"
                  name="المساهمات"
                  stroke="#2D5A3D"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="disbursed"
                  name="الصرف"
                  stroke="#B8492B"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* جدول العمليات */}
      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="size-5 text-primary" />
            تفاصيل العمليات
            <Badge variant="secondary" className="ms-2">
              {data.transactions.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 p-10 text-center">
              <Inbox className="size-12 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">
                لا توجد عمليات في هذه الفترة
              </p>
            </div>
          ) : (
            <div className="max-h-[28rem] overflow-y-auto custom-scrollbar rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 sticky top-0">
                  <tr>
                    <th className="text-start px-3 py-2.5 font-semibold text-muted-foreground text-xs">التاريخ</th>
                    <th className="text-start px-3 py-2.5 font-semibold text-muted-foreground text-xs">النوع</th>
                    <th className="text-start px-3 py-2.5 font-semibold text-muted-foreground text-xs">المرجع</th>
                    <th className="text-start px-3 py-2.5 font-semibold text-muted-foreground text-xs">بواسطة</th>
                    <th className="text-start px-3 py-2.5 font-semibold text-muted-foreground text-xs">الحالة</th>
                    <th className="text-end px-3 py-2.5 font-semibold text-muted-foreground text-xs">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((tx, i) => (
                    <tr
                      key={i}
                      className="border-t border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {formatDateTimeArabic(tx.date)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                            tx.isContribution
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {tx.isContribution ? (
                            <TrendingUp className="size-3" />
                          ) : (
                            <TrendingDown className="size-3" />
                          )}
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs font-mono">
                        {tx.reference}
                      </td>
                      <td className="px-3 py-2.5 text-xs">{tx.by}</td>
                      <td className="px-3 py-2.5 text-xs">
                        {tx.isContribution
                          ? CONTRIBUTION_STATUS_LABELS[tx.status as ContributionStatus] ?? tx.status
                          : (FUND_REQUEST_STATUS_LABELS[tx.status as FundRequestStatus]?.label) ?? tx.status}
                      </td>
                      <td className="px-3 py-2.5 text-end text-xs font-bold">
                        {formatMAD(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
