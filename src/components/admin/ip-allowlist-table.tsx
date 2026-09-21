"use client";

import * as React from "react";
import { Plus, Trash2, RefreshCw, Wifi, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Switch } from "@/components/ui/switch";

interface IPRecord {
  id: string;
  ip: string;
  note: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string | Date;
}

export function IPAllowlistTable({
  ips: initialIPs,
  enabled: initialEnabled,
}: {
  ips: IPRecord[];
  enabled: boolean;
}) {
  const [ips, setIPs] = React.useState<IPRecord[]>(initialIPs);
  const [enabled, setEnabled] = React.useState(initialEnabled);
  const [newIP, setNewIP] = React.useState("");
  const [newNote, setNewNote] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [toggling, setToggling] = React.useState(false);
  const [myIP, setMyIP] = React.useState<string | null>(null);

  // احصل على IP الزائر
  React.useEffect(() => {
    fetch("/api/internal/my-ip")
      .then((r) => r.json())
      .then((d) => setMyIP(d.ip))
      .catch(() => {});
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIP.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: newIP.trim(), note: newNote.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("تمت إضافة IP", { description: newIP });
      setIPs((p) => [data.ip, ...p]);
      setNewIP("");
      setNewNote("");
    } catch (err) {
      toast.error("فشل الإضافة", {
        description: err instanceof Error ? err.message : "خطأ",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async () => {
    setToggling(true);
    try {
      const res = await fetch("/api/admin/ips/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEnabled(!enabled);
      toast.success(
        !enabled ? "تم تفعيل قائمة IP" : "تم تعطيل قائمة IP",
        {
          description: !enabled
            ? "الآن فقط IPs المُدرجة يمكنها الوصول"
            : "كل IPs مسموح بها الآن",
        }
      );
    } catch (err) {
      toast.error("فشل التبديل", {
        description: err instanceof Error ? err.message : "خطأ",
      });
    } finally {
      setToggling(false);
    }
  };

  const handleToggleIP = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/ips/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      if (!res.ok) throw new Error("فشل التحديث");
      setIPs((p) =>
        p.map((ip) => (ip.id === id ? { ...ip, isActive: !current } : ip))
      );
      toast.success(!current ? "تم تفعيل IP" : "تم تعطيل IP");
    } catch (err) {
      toast.error("خطأ", {
        description: err instanceof Error ? err.message : "فشل",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ips/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل الحذف");
      setIPs((p) => p.filter((ip) => ip.id !== id));
      toast.success("تم حذف IP");
    } catch (err) {
      toast.error("خطأ", {
        description: err instanceof Error ? err.message : "فشل",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* تفعيل القائمة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">حالة قائمة IP</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Switch
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={toggling}
              aria-label="تفعيل قائمة IP"
            />
            <div className="text-sm">
              <p className="font-medium">
                {enabled ? "القائمة مُفعّلة" : "القائمة معطّلة"}
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {enabled
                  ? "فقط IPs المُدرجة بالأسفل يمكنها الوصول للمنصة"
                  : "كل IPs مسموح بها — القائمة لا تؤثّر"}
              </p>
            </div>
          </div>
          <Badge variant={enabled ? "default" : "secondary"}>
            {enabled ? "مُفعّلة" : "معطّلة"}
          </Badge>
        </CardContent>
      </Card>

      {/* إضافة IP */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">إضافة IP جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-ip">عنوان IP *</Label>
                <Input
                  id="new-ip"
                  placeholder="192.168.1.1 أو ::1"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  required
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-note">ملاحظة (اختياري)</Label>
                <Input
                  id="new-note"
                  placeholder="مكتب الإدارة"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={adding} className="h-11">
                <Plus className="size-4" />
                <span>{adding ? "جارٍ الإضافة..." : "إضافة"}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => setNewIP(myIP || "")}
              >
                <Wifi className="size-4" />
                <span>أضف IP الحالي{myIP ? ` (${myIP})` : ""}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* قائمة IPs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            IPs المسجّلة ({ips.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShieldOff className="size-8 mx-auto mb-2 opacity-50" />
              <p>لا توجد IPs مسجّلة</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP</TableHead>
                  <TableHead>ملاحظة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>أُنشئت في</TableHead>
                  <TableHead className="text-end">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ips.map((ip) => (
                  <TableRow key={ip.id}>
                    <TableCell className="font-mono" dir="ltr">
                      {ip.ip}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ip.note || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={ip.isActive ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleToggleIP(ip.id, ip.isActive)}
                      >
                        {ip.isActive ? "نشط" : "معطّل"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(ip.createdAt).toLocaleDateString("ar-MA")}
                    </TableCell>
                    <TableCell className="text-end">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive"
                            aria-label="حذف"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل تريد حذف IP{" "}
                              <span className="font-mono" dir="ltr">
                                {ip.ip}
                              </span>{" "}
                              من القائمة؟
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(ip.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
