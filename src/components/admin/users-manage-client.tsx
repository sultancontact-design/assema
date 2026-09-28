"use client";
import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Search, Plus, KeyRound, Lock, Unlock, Trash2, RefreshCw, Copy, CheckCircle2 } from "lucide-react";

interface UserRow { id: string; fullName: string; email: string; phone: string; role: string; status: string; isLocked: boolean; lastLoginAt?: string | null; createdAt: string; district?: { nameAr: string } | null }
const ROLES: Record<string, string> = { GUEST: "زائر", MEMBER: "عضو", GROUP_LEADER: "قائد مجموعة", DISTRICT_MODERATOR: "مشرف حي", ADS_MANAGER: "مدير إعلانات", ETHICS_COMMITTEE: "لجنة أخلاقيات", TREASURER: "أمين صندوق", SUPER_ADMIN: "سوبر أدمن" };
const ROLE_COLORS: Record<string, string> = { GUEST: "bg-muted", MEMBER: "bg-primary/10 text-primary", SUPER_ADMIN: "bg-red-100 text-red-800", TREASURER: "bg-yellow-100 text-yellow-800", DISTRICT_MODERATOR: "bg-blue-100 text-blue-800" };

export function UsersManageClient() {
  const [users, setUsers] = React.useState<UserRow[] | null>(null);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [resultDialog, setResultDialog] = React.useState<{ open: boolean; title: string; pwd?: string }>({ open: false, title: "" });
  const [form, setForm] = React.useState({ firstName: "", lastName: "", email: "", phone: "", role: "MEMBER" });

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams(); if (search) p.set("q", search); p.set("page", String(page));
      const res = await fetch(`/api/admin/users/manage?${p}`, { cache: "no-store" });
      if (res.ok) { const d = await res.json(); setUsers(d.users); setTotal(d.total); setTotalPages(d.totalPages); }
    } catch { setUsers([]); } setLoading(false);
  }, [search, page]);
  React.useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/users/manage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error ?? "فشل"); return; }
    const d = await res.json();
    setCreateOpen(false); setResultDialog({ open: true, title: `تم إنشاء ${form.firstName}`, pwd: d.temporaryPassword });
    setForm({ firstName: "", lastName: "", email: "", phone: "", role: "MEMBER" }); fetchUsers();
  };
  const reset = async (id: string) => {
    const res = await fetch(`/api/admin/users/manage/${id}/reset-password`, { method: "POST" });
    if (!res.ok) { toast.error("فشل"); return; }
    const d = await res.json(); setResultDialog({ open: true, title: "كلمة مرور جديدة", pwd: d.temporaryPassword });
  };
  const toggleLock = async (id: string, currentlyLocked: boolean) => {
    const url = currentlyLocked ? "unlock" : "lock";
    const body = currentlyLocked ? undefined : { reason: "Locked by admin" };
    const res = await fetch(`/api/admin/users/manage/${id}/${url}`, { method: "POST", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    if (res.ok) { toast.success(currentlyLocked ? "فتح" : "قفل"); fetchUsers(); }
  };
  const handleDelete = async (id: string) => { if (!confirm("حذف ناعم؟")) return; const res = await fetch(`/api/admin/users/manage/${id}`, { method: "DELETE" }); if (res.ok) { toast.success("حذف"); fetchUsers(); } };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-2xl font-bold flex items-center gap-2"><Users className="size-7 text-primary" /><span>إدارة المستخدمين</span></h1><p className="text-sm text-muted-foreground">{total} مستخدم</p></div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="size-4" /><span>مستخدم جديد</span></Button>
      </header>
      <Card className="mb-4"><CardContent className="p-4"><div className="relative"><Search className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground" /><Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="ابحث..." className="ps-9 h-11" /></div></CardContent></Card>
      {loading || !users ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div> : (
        <div className="space-y-2">
          {users.map(u => (
            <Card key={u.id} className={u.isLocked ? "border-red-300" : ""}><CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap mb-1"><h3 className="font-bold">{u.fullName}</h3><Badge className={`${ROLE_COLORS[u.role] ?? "bg-muted"} text-[10px]`}>{ROLES[u.role] ?? u.role}</Badge>{u.isLocked && <Badge variant="destructive" className="text-[10px]"><Lock className="size-3" /> مقفول</Badge>}</div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="font-mono" dir="ltr">{u.email}</span><span className="font-mono" dir="ltr">{u.phone}</span>{u.district?.nameAr && <span>· {u.district.nameAr}</span>}</div></div>
                <div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => reset(u.id)} title="كلمة مرور جديدة"><KeyRound className="size-4" /></Button>{u.isLocked ? <Button size="sm" variant="ghost" onClick={() => toggleLock(u.id, true)} title="فتح"><Unlock className="size-4" /></Button> : <Button size="sm" variant="ghost" onClick={() => toggleLock(u.id, false)} title="قفل"><Lock className="size-4" /></Button>}<Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(u.id)} title="حذف"><Trash2 className="size-4" /></Button></div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
      {totalPages > 1 && <div className="flex items-center justify-center gap-2 mt-4"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>السابق</Button><span className="text-sm">{page}/{totalPages}</span><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>التالي</Button></div>}
      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>مستخدم جديد</DialogTitle></DialogHeader>
        <form onSubmit={create} className="space-y-3">
          <div className="grid grid-cols-2 gap-3"><div><label className="text-sm">الاسم الأول *</label><Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className="h-11" required /></div><div><label className="text-sm">العائلة *</label><Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className="h-11" required /></div></div>
          <div><label className="text-sm">البريد *</label><Input type="email" dir="ltr" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="h-11" required /></div>
          <div><label className="text-sm">الهاتف *</label><Input dir="ltr" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="06XXXXXXXX" className="h-11" required /></div>
          <div><label className="text-sm">الدور</label><select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full h-11 rounded-md border px-3">{Object.entries(ROLES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>إلغاء</Button><Button type="submit">إنشاء</Button></DialogFooter>
        </form>
      </DialogContent></Dialog>
      {/* Result dialog (password) */}
      <Dialog open={resultDialog.open} onOpenChange={o => setResultDialog({ ...resultDialog, open: o })}><DialogContent className="max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2"><CheckCircle2 className="size-5 text-emerald-600" />{resultDialog.title}</DialogTitle></DialogHeader>
        {resultDialog.pwd && <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 p-3"><p className="text-sm font-bold mb-1">كلمة المرور:</p><code className="block bg-background p-2 rounded font-mono text-sm break-all" dir="ltr">{resultDialog.pwd}</code><Button size="sm" variant="outline" className="mt-2" onClick={() => { navigator.clipboard.writeText(resultDialog.pwd!); toast.success("نسخ"); }}><Copy className="size-4" />نسخ</Button></div>}
        <DialogFooter><Button onClick={() => setResultDialog({ ...resultDialog, open: false })}>تم</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}
