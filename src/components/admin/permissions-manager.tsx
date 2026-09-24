"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, ShieldCheck, ShieldOff, FileDown } from "lucide-react";

interface Perm { id: string; userId: string; reportType: string; grantedAt: string; expiresAt: string | null; isActive: boolean }
interface Log { id: string; userId: string; reportType: string; reportId: string | null; status: string; reason: string | null; downloadedAt: string }
interface User { id: string; fullName: string; email: string; role: string }

const REPORT_TYPES = [
  { value: "FUND_REPORT", label: "تقرير صندوق المعروف" },
  { value: "EVENT_REPORT", label: "تقرير فعالية" },
  { value: "USER_DATA", label: "بيانات مستخدم" },
  { value: "LEDGER", label: "سجل النقاط" },
  { value: "ALL", label: "كل التقارير" },
];

export function PermissionsManager({ permissions, logs, users, currentUserId }: { permissions: Perm[]; logs: Log[]; users: User[]; currentUserId: string }) {
  const [showGrant, setShowGrant] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState("");
  const [reportType, setReportType] = React.useState("FUND_REPORT");
  const [submitting, setSubmitting] = React.useState(false);

  const userName = (uid: string) => users.find(u => u.id === uid)?.fullName ?? "مستخدم محذوف";

  const grant = async () => {
    if (!selectedUser) { toast.error("اختر مستخدماً"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser, reportType }),
      });
      const data = await res.json();
      if (res.ok) { toast.success("تم منح الصلاحية"); setShowGrant(false); setTimeout(() => window.location.reload(), 1000); }
      else toast.error(data.error ?? "فشل");
    } catch { toast.error("خطأ"); }
    setSubmitting(false);
  };

  const revoke = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/permissions/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("تم سحب الصلاحية"); setTimeout(() => window.location.reload(), 500); }
    } catch { toast.error("فشل"); }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Shield className="size-4" /> الصلاحيات النشطة ({permissions.filter(p => p.isActive).length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="px-4 pb-3"><Button size="sm" onClick={() => setShowGrant(!showGrant)} className="h-9"><ShieldCheck className="size-4" /> منح صلاحية</Button></div>
          {showGrant && (
            <div className="px-4 pb-4 space-y-3 border-b border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground">المستخدم</label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="اختر مستخدماً" /></SelectTrigger>
                    <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.fullName} ({u.email})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><label className="text-xs text-muted-foreground">نوع التقرير</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{REPORT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={grant} disabled={submitting} className="h-9">{submitting ? "جارٍ..." : "منح"}</Button>
            </div>
          )}
          <Table>
            <TableHeader><TableRow><TableHead>المستخدم</TableHead><TableHead>النوع</TableHead><TableHead>التاريخ</TableHead><TableHead>الحالة</TableHead><TableHead>إجراء</TableHead></TableRow></TableHeader>
            <TableBody>
              {permissions.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">لا توجد صلاحيات</TableCell></TableRow> :
                permissions.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{userName(p.userId)}</TableCell>
                    <TableCell><Badge variant="outline">{REPORT_TYPES.find(t => t.value === p.reportType)?.label ?? p.reportType}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(p.grantedAt).toLocaleDateString("ar-MA")}</TableCell>
                    <TableCell>{p.isActive ? <Badge className="bg-secondary text-secondary-foreground">نشط</Badge> : <Badge variant="secondary">معطّل</Badge>}</TableCell>
                    <TableCell>{p.isActive && <Button size="sm" variant="ghost" className="text-destructive h-8" onClick={() => revoke(p.id)}><ShieldOff className="size-3.5" /></Button>}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><FileDown className="size-4" /> سجل التحميل ({logs.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>المستخدم</TableHead><TableHead>النوع</TableHead><TableHead>الحالة</TableHead><TableHead>السبب</TableHead><TableHead>التاريخ</TableHead></TableRow></TableHeader>
            <TableBody>
              {logs.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">لا توجد محاولات</TableCell></TableRow> :
                logs.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{userName(l.userId)}</TableCell>
                    <TableCell><Badge variant="outline">{l.reportType}</Badge></TableCell>
                    <TableCell><Badge variant={l.status === "GRANTED" ? "default" : "destructive"}>{l.status === "GRANTED" ? "مسموح" : "مرفوض"}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.reason ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(l.downloadedAt).toLocaleString("ar-MA")}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
