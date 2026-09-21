"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ListChecks,
  Download,
  Inbox,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { toast } from "sonner";
import { formatMAD, formatDateTimeArabic } from "@/lib/constants";

export interface StatementClientProps {
  family: {
    familyName: string;
    headOfFamily: string;
    memberCount: number;
    economicStatus: string;
  };
  availableYears: number[];
  summary: {
    totalContributions: number;
    totalDisbursed: number;
    balance: number;
    transactionsCount: number;
  };
  transactions: {
    date: string; // ISO
    type: "مساهمة" | "صرف";
    reference: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
  }[];
  monthlySeries: {
    month: string;
    balance: number;
    contributions: number;
    disbursed: number;
  }[];
}

export function FundStatementClient({
  family,
  availableYears,
  summary,
  transactions,
  monthlySeries,
}: StatementClientProps) {
  const [yearFilter, setYearFilter] = React.useState<string>("all");
  const [downloading, setDownloading] = React.useState(false);

  const filtered = React.useMemo(() => {
    if (yearFilter === "all") return transactions;
    const y = parseInt(yearFilter, 10);
    return transactions.filter((t) => new Date(t.date).getFullYear() === y);
  }, [transactions, yearFilter]);

  const filteredBalance = React.useMemo(() => {
    return filtered.reduce((s, t) => s + (t.credit - t.debit), 0);
  }, [filtered]);

  const filteredContributions = React.useMemo(
    () => filtered.reduce((s, t) => s + t.credit, 0),
    [filtered]
  );
  const filteredDisbursed = React.useMemo(
    () => filtered.reduce((s, t) => s + t.debit, 0),
    [filtered]
  );

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const url =
        yearFilter === "all"
          ? "/api/fund/statement/pdf"
          : `/api/fund/statement/pdf?year=${yearFilter}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "فشل التنزيل");
      }
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `كشف-حساب-${family.familyName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success("تم تنزيل كشف الحساب PDF بنجاح");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "حدث خطأ أثناء تنزيل الملف"
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* بطاقات الملخّص */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="warm-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                <ArrowUpCircle className="size-4 text-emerald-600" />
                إجمالي المساهمات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-700">
                {formatMAD(
                  yearFilter === "all"
                    ? summary.totalContributions
                    : filteredContributions
                )}
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card className="warm-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                <ArrowDownCircle className="size-4 text-rose-600" />
                إجمالي الصرف
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-rose-700">
                {formatMAD(
                  yearFilter === "all" ? summary.totalDisbursed : filteredDisbursed
                )}
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
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
                  (yearFilter === "all" ? summary.balance : filteredBalance) >= 0
                    ? "text-foreground"
                    : "text-rose-600"
                }`}
              >
                {formatMAD(
                  yearFilter === "all" ? summary.balance : filteredBalance
                )}
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card className="warm-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                <ListChecks className="size-4 text-muted-foreground" />
                عدد المعاملات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {filtered.length}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* الرسم البياني لتطوّر الرصيد */}
      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-5 text-primary" />
            تطوّر الرصيد الشهري
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlySeries}
                margin={{ top: 5, right: 20, bottom: 5, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fontFamily: "Tajawal" }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v) => `${v.toLocaleString("ar-MA")}`}
                  width={60}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === "الرصيد") return [formatMAD(value), name];
                    return [value, name];
                  }}
                  labelStyle={{ fontFamily: "Tajawal" }}
                  contentStyle={{
                    fontFamily: "Tajawal",
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
                <Line
                  type="monotone"
                  dataKey="balance"
                  name="الرصيد"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* الفلاتر + تنزيل PDF */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">سنة:</label>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-40 h-11">
              <SelectValue placeholder="كل السنوات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل السنوات</SelectItem>
              {availableYears.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  سنة {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleDownload}
          disabled={downloading}
          size="lg"
          className="h-11"
        >
          <Download className="size-4" />
          {downloading ? "جاري التحضير..." : "تنزيل PDF"}
        </Button>
      </div>

      {/* جدول المعاملات */}
      <Card className="warm-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="size-5 text-primary" />
            تفاصيل المعاملات
            <Badge variant="secondary" className="ms-2">
              {filtered.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 p-10 text-center">
              <Inbox className="size-12 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">
                لا توجد معاملات في هذه الفترة
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
                    <th className="text-start px-3 py-2.5 font-semibold text-muted-foreground text-xs">الوصف</th>
                    <th className="text-end px-3 py-2.5 font-semibold text-muted-foreground text-xs">مَخصوم</th>
                    <th className="text-end px-3 py-2.5 font-semibold text-muted-foreground text-xs">مُضاف</th>
                    <th className="text-end px-3 py-2.5 font-semibold text-muted-foreground text-xs">الرصيد</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx, i) => (
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
                            tx.type === "مساهمة"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {tx.type === "مساهمة" ? (
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
                      <td className="px-3 py-2.5 text-xs">
                        {tx.description}
                      </td>
                      <td className="px-3 py-2.5 text-end text-xs text-rose-700 font-medium">
                        {tx.debit > 0 ? formatMAD(tx.debit) : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-end text-xs text-emerald-700 font-medium">
                        {tx.credit > 0 ? formatMAD(tx.credit) : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-end text-xs font-bold">
                        {formatMAD(tx.balance)}
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
