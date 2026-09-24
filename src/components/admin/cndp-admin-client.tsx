"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ShieldCheck,
  Clock,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  UserCircle,
} from "lucide-react";

interface CndpRequest {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  nationalId: string | null;
  requestType: string;
  description: string;
  targetData: string | null;
  status: string;
  adminResponse: string | null;
  assignedTo: string | null;
  expiresAt: string;
  processedAt: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  ACCESS: "حق الوصول",
  RECTIFICATION: "حق التصحيح",
  ERASURE: "حق المحو",
  RESTRICTION: "حق التقييد",
  PORTABILITY: "حق النقل",
  OBJECTION: "حق الاعتراض",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد الانتظار",
  IN_REVIEW: "قيد الدراسة",
  APPROVED: "مقبولة + نُفّذت",
  PARTIALLY: "نُفّذت جزئياً",
  REJECTED: "مرفوضة",
  EXPIRED: "انقضت المهلة",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  IN_REVIEW: "bg-blue-100 text-blue-800 border-blue-200",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  PARTIALLY: "bg-yellow-100 text-yellow-800 border-yellow-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  EXPIRED: "bg-gray-100 text-gray-800 border-gray-200",
};

export function CndpAdminClient({ requests }: { requests: CndpRequest[] }) {
  const [items, setItems] = React.useState(requests);
  const [filter, setFilter] = React.useState("ALL");
  const [processing, setProcessing] = React.useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = React.useState<CndpRequest | null>(null);
  const [newStatus, setNewStatus] = React.useState("");
  const [adminResponse, setAdminResponse] = React.useState("");

  const filtered = filter === "ALL"
    ? items
    : items.filter((r) => r.status === filter);

  const countByStatus = (status: string) => items.filter((r) => r.status === status).length;
  const overdueCount = items.filter((r) => {
    return !["APPROVED", "PARTIALLY", "REJECTED", "EXPIRED"].includes(r.status) &&
      new Date(r.expiresAt) < new Date();
  }).length;

  const openProcess = (req: CndpRequest) => {
    setSelectedRequest(req);
    setNewStatus(req.status);
    setAdminResponse(req.adminResponse ?? "");
  };

  const submitProcess = async () => {
    if (!selectedRequest) return;
    if (!adminResponse.trim() && ["APPROVED", "PARTIALLY", "REJECTED"].includes(newStatus)) {
      toast.error("ردّ الإدارة مطلوب للحالة المختارة");
      return;
    }
    setProcessing(selectedRequest.id);
    try {
      const res = await fetch(`/api/cndp/requests/${selectedRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          adminResponse,
          assignedTo: "current-admin", // server-side replaces with real user
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "فشل التحديث");
        setProcessing(null);
        return;
      }
      const data = await res.json();
      setItems((items) =>
        items.map((i) => (i.id === selectedRequest.id ? data.request : i)),
      );
      setSelectedRequest(null);
      toast.success("حُدّثت حالة الطلب");
    } catch {
      toast.error("فشل الاتصال");
    }
    setProcessing(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1 flex items-center gap-2">
          <ShieldCheck className="size-7 text-primary" />
          <span>طلبات حماية البيانات (CNDP)</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          القانون 09-08 — مهلة الاستجابة 30 يوماً (المادة 31). غرامة المخالفة حتى 300,000 درهم.
        </p>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">الإجمالي</p>
            <p className="font-heading text-lg font-bold">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">قيد الانتظار</p>
            <p className="font-heading text-lg font-bold text-amber-600">{countByStatus("PENDING")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">قيد الدراسة</p>
            <p className="font-heading text-lg font-bold text-blue-600">{countByStatus("IN_REVIEW")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">مقبولة</p>
            <p className="font-heading text-lg font-bold text-emerald-600">{countByStatus("APPROVED")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">مرفوضة</p>
            <p className="font-heading text-lg font-bold text-red-600">{countByStatus("REJECTED")}</p>
          </CardContent>
        </Card>
        <Card className={overdueCount > 0 ? "border-red-300 bg-red-50/30" : ""}>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">متأخّرة</p>
            <p className="font-heading text-lg font-bold text-red-700">{overdueCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            filter === "ALL" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
          }`}
        >
          الكل ({items.length})
        </button>
        {Object.keys(STATUS_LABELS).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
            }`}
          >
            {STATUS_LABELS[s]} ({countByStatus(s)})
          </button>
        ))}
      </div>

      {/* Requests list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <FileText className="size-8 mx-auto mb-2 opacity-50" />
            <p>لا توجد طلبات في هذه الحالة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const overdue = !["APPROVED", "PARTIALLY", "REJECTED", "EXPIRED"].includes(req.status) &&
              new Date(req.expiresAt) < new Date();
            const daysLeft = Math.ceil((new Date(req.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
            return (
              <Card
                key={req.id}
                className={overdue ? "border-red-300" : ""}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={`${STATUS_COLORS[req.status] ?? ""} text-[10px]`}>
                          {STATUS_LABELS[req.status] ?? req.status}
                        </Badge>
                        <Badge variant="outline">{TYPE_LABELS[req.requestType] ?? req.requestType}</Badge>
                        {overdue && (
                          <Badge variant="destructive" className="text-[10px]">
                            <AlertTriangle className="size-3" /> متأخّر
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-foreground flex items-center gap-2">
                        <UserCircle className="size-4" />
                        {req.fullName}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {req.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="size-3" />
                          {req.email}
                        </span>
                        {req.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="size-3" />
                            {req.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {overdue
                            ? "انقضت المهلة"
                            : daysLeft > 0
                              ? `${daysLeft} يوم متبقٍّ`
                              : "اليوم آخر أجل"}
                        </span>
                      </div>
                      {req.adminResponse && (
                        <div className="mt-2 p-2 rounded-md bg-muted/50 text-xs">
                          <span className="font-bold">ردّ الإدارة: </span>
                          {req.adminResponse}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openProcess(req)}
                      disabled={["APPROVED", "PARTIALLY", "REJECTED", "EXPIRED"].includes(req.status) && !req.adminResponse}
                    >
                      <RefreshCw className="size-4" />
                      <span className="sr-only sm:not-sr-only sm:ms-1">معالجة</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Process dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5" />
              معالجة طلب {TYPE_LABELS[selectedRequest?.requestType ?? ""] ?? ""}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">صاحب الطلب</p>
                  <p className="font-bold">{selectedRequest.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">البريد</p>
                  <p className="font-mono text-xs" dir="ltr">{selectedRequest.email}</p>
                </div>
              </div>
              <div className="rounded-md bg-muted/30 p-3 text-sm">
                <p className="font-bold mb-1">الوصف:</p>
                <p>{selectedRequest.description}</p>
                {selectedRequest.targetData && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    البيانات المعنية: {selectedRequest.targetData}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-bold mb-1.5 block">الحالة الجديدة</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(STATUS_LABELS).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  ردّ الإدارة <span className="text-destructive">*</span>
                </label>
                <Textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="اشرح الإجراء المُتّخذ أو سبب الرفض..."
                  className="min-h-[100px]"
                />
              </div>
              {["APPROVED", "PARTIALLY"].includes(newStatus) && (
                <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-900">
                  <CheckCircle2 className="size-4 inline me-1" />
                  سيُسجّل وقت المعالجة تلقائياً وستُغلَق القضية. سيُرسل بريد
                  إشعار لصاحب الطلب.
                </div>
              )}
              {newStatus === "REJECTED" && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-900">
                  <XCircle className="size-4 inline me-1" />
                  الرفض يتطلّب تسبيباً قانونياً مُفصّلاً. بدون سبب مُقنع،
                  يحقّ للّجنة الوطنية (CNDP) إلغاء قرارنا.
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              إلغاء
            </Button>
            <Button
              onClick={submitProcess}
              disabled={processing === selectedRequest?.id}
            >
              {processing === selectedRequest?.id ? "جاري..." : "حفظ القرار"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
