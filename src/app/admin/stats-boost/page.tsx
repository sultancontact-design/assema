"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, User, Video, FileText, Heart, MessageCircle, Share2, Bookmark, Eye, Award, Search } from "lucide-react";

const BOOST_FIELDS: Record<string, { key: string; label: string; icon: any }[]> = {
  USER: [{ key: "points", label: "نقاط", icon: Award }],
  VIDEO: [
    { key: "likes", label: "إعجابات", icon: Heart },
    { key: "comments", label: "تعليقات", icon: MessageCircle },
    { key: "shares", label: "مشاركات", icon: Share2 },
    { key: "views", label: "مشاهدات", icon: Eye },
  ],
  POST: [
    { key: "likes", label: "إعجابات", icon: Heart },
    { key: "views", label: "مشاهدات", icon: Eye },
  ],
};

export default function StatsBoostPage() {
  const [tab, setTab] = React.useState<"USER" | "VIDEO" | "POST">("USER");
  const [query, setQuery] = React.useState("");
  const [targets, setTargets] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<any>(null);
  const [field, setField] = React.useState("");
  const [amount, setAmount] = React.useState(10);
  const [reason, setReason] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [boostLoading, setBoostLoading] = React.useState(false);

  const loadTargets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats-targets?type=${tab}&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (tab === "USER") setTargets(data.users || []);
      else if (tab === "VIDEO") setTargets(data.videos || []);
      else setTargets(data.posts || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { loadTargets(); }, [tab]);

  const handleBoost = async () => {
    if (!selected || !field || !amount) return;
    setBoostLoading(true);
    try {
      const res = await fetch("/api/admin/stats-boost", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: tab, targetId: selected.id, field, amount, reason }),
      });
      if (!res.ok) throw new Error("فشل");
      alert(`✅ تم إضافة ${amount} إلى ${field}`);
      loadTargets(); setSelected(null); setField(""); setAmount(10); setReason("");
    } catch { alert("فشل. حاول مرة أخرى."); }
    finally { setBoostLoading(false); }
  };

  return (
    <div className="container mx-auto py-8 px-4" dir="rtl">
      <div className="mb-6"><h1 className="text-3xl font-bold">تحكم في الإحصائيات</h1><p className="text-muted-foreground mt-1">زيادة الإعجابات، المشاهدات، النقاط لأي حساب أو محتوى</p></div>
      <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setSelected(null); setField(""); }}>
        <TabsList className="mb-6">
          <TabsTrigger value="USER" className="gap-2"><User className="w-4 h-4" /> المستخدمون</TabsTrigger>
          <TabsTrigger value="VIDEO" className="gap-2"><Video className="w-4 h-4" /> الفيديوهات</TabsTrigger>
          <TabsTrigger value="POST" className="gap-2"><FileText className="w-4 h-4" /> المقالات</TabsTrigger>
        </TabsList>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardContent className="p-4">
            <div className="flex gap-2 mb-4"><Input placeholder="ابحث..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadTargets()} /><Button onClick={loadTargets} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}</Button></div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {targets.map((t) => (
                <button key={t.id} onClick={() => setSelected(t)} className={`w-full text-right p-3 rounded-lg transition ${selected?.id === t.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0"><div className="font-medium truncate">{tab === "USER" ? t.fullName : t.title}</div><div className="text-xs opacity-75 truncate">{tab === "USER" ? t.email : tab === "VIDEO" ? `${t.user?.fullName} — ${t.likes} ❤️` : `${t.views} 👁`}</div></div>
                  </div>
                </button>
              ))}
              {!loading && targets.length === 0 && <p className="text-center text-muted-foreground py-8">لا توجد نتائج</p>}
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-6">
            {selected ? (
              <div className="space-y-6">
                <div className="p-3 bg-muted rounded-lg"><div className="font-medium">{tab === "USER" ? selected.fullName : selected.title}</div><div className="text-xs text-muted-foreground">{tab === "USER" ? selected.email : tab === "VIDEO" ? selected.user?.fullName : ""}</div></div>
                <div><label className="text-sm font-medium block mb-2">الحقل:</label><div className="grid grid-cols-2 gap-2">{BOOST_FIELDS[tab].map((f) => (<button key={f.key} onClick={() => setField(f.key)} className={`flex items-center gap-2 p-3 rounded-lg border transition ${field === f.key ? "border-primary bg-primary/10" : "hover:bg-muted"}`}><f.icon className="w-4 h-4" /><span>{f.label}</span></button>))}</div></div>
                <div><label className="text-sm font-medium block mb-2">الكمية:</label><Input type="number" value={amount} onChange={(e) => setAmount(parseInt(e.target.value) || 0)} min={1} max={100000} /><div className="flex gap-2 mt-2">{[10, 50, 100, 500, 1000].map((n) => (<button key={n} onClick={() => setAmount(n)} className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded-full">{n}</button>))}</div></div>
                <div><label className="text-sm font-medium block mb-2">السبب (اختياري):</label><Input placeholder="مثال: حملة تسويقية..." value={reason} onChange={(e) => setReason(e.target.value)} /></div>
                <Button onClick={handleBoost} disabled={!field || !amount || boostLoading} className="w-full" size="lg">{boostLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}<TrendingUp className="w-4 h-4 mr-2" />زيادة {amount} {BOOST_FIELDS[tab].find((f) => f.key === field)?.label}</Button>
                <p className="text-xs text-muted-foreground text-center">⚠️ كل عملية تسجّل في Audit Log</p>
              </div>
            ) : (<div className="text-center py-16 text-muted-foreground"><TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>اختر من القائمة</p></div>)}
          </CardContent></Card>
        </div>
      </Tabs>
    </div>
  );
}
