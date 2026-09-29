"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, User, Video, FileText, Heart, MessageCircle, Share2, Eye, Award, Search, Sparkles, Zap } from "lucide-react";

const FIELDS: Record<string, any[]> = {
  USER: [{ key: "followers", label: "متابعون", icon: User }, { key: "following", label: "يتابع", icon: User }, { key: "points", label: "نقاط", icon: Award }],
  VIDEO: [{ key: "likes", label: "إعجابات", icon: Heart }, { key: "comments", label: "تعليقات", icon: MessageCircle }, { key: "shares", label: "مشاركات", icon: Share2 }, { key: "views", label: "مشاهدات", icon: Eye }],
  POST: [{ key: "likes", label: "إعجابات", icon: Heart }, { key: "views", label: "مشاهدات", icon: Eye }],
};

export default function SocialBoostPage() {
  const [tab, setTab] = React.useState<"USER" | "VIDEO" | "POST" | "COMMENTS">("USER");
  const [query, setQuery] = React.useState("");
  const [targets, setTargets] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<any>(null);
  const [field, setField] = React.useState("");
  const [amount, setAmount] = React.useState(100);
  const [reason, setReason] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [boostLoading, setBoostLoading] = React.useState(false);
  const [templates, setTemplates] = React.useState<any[]>([]);
  const [commentTargetId, setCommentTargetId] = React.useState("");
  const [commentTargetType, setCommentTargetType] = React.useState("VIDEO");
  const [commentCount, setCommentCount] = React.useState(10);
  const [addingComments, setAddingComments] = React.useState(false);

  const loadTargets = async () => {
    if (tab === "COMMENTS") return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats-targets?type=${tab}&q=${encodeURIComponent(query)}`);
      const d = await res.json();
      setTargets(tab === "USER" ? d.users || [] : tab === "VIDEO" ? d.videos || [] : d.posts || []);
    } catch {} finally { setLoading(false); }
  };

  const loadTemplates = async () => {
    try { const res = await fetch("/api/admin/fake-comments"); const d = await res.json(); setTemplates(d.templates || []); } catch {}
  };

  React.useEffect(() => { tab === "COMMENTS" ? loadTemplates() : loadTargets(); }, [tab]);

  const handleBoost = async () => {
    if (!selected || !field || !amount) return;
    setBoostLoading(true);
    try {
      await fetch("/api/admin/stats-boost", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetType: tab, targetId: selected.id, field, amount, reason }) });
      alert(`✅ تم إضافة ${amount}`); loadTargets(); setSelected(null); setField(""); setAmount(100); setReason("");
    } catch { alert("فشل"); } finally { setBoostLoading(false); }
  };

  const handleAddComments = async () => {
    if (!commentTargetId || !commentCount) return;
    setAddingComments(true);
    try {
      const res = await fetch("/api/admin/fake-comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetType: commentTargetType, targetId: commentTargetId, count: commentCount }) });
      const d = await res.json();
      if (res.ok) { alert(`✅ تم إضافة ${d.created} تعليق`); setCommentTargetId(""); } else alert("فشل");
    } catch { alert("خطأ"); } finally { setAddingComments(false); }
  };

  return (
    <div className="container mx-auto py-8 px-4" dir="rtl">
      <div className="mb-6"><h1 className="text-3xl font-bold flex items-center gap-2"><Sparkles className="w-8 h-8 text-amber-500" /> تحكم في الإحصائيات والتعليقات</h1><p className="text-muted-foreground mt-1">زيادة المتابعين، الإعجابات، المشاهدات — وإضافة تعليقات جاهزة</p></div>
      <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setSelected(null); setField(""); }}>
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="USER" className="gap-2"><User className="w-4 h-4" /> المستخدمون</TabsTrigger>
          <TabsTrigger value="VIDEO" className="gap-2"><Video className="w-4 h-4" /> الفيديوهات</TabsTrigger>
          <TabsTrigger value="POST" className="gap-2"><FileText className="w-4 h-4" /> المقالات</TabsTrigger>
          <TabsTrigger value="COMMENTS" className="gap-2"><MessageCircle className="w-4 h-4" /> تعليقات جاهزة</TabsTrigger>
        </TabsList>
        {tab !== "COMMENTS" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card><CardContent className="p-4">
              <div className="flex gap-2 mb-4"><Input placeholder="ابحث..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadTargets()} /><Button onClick={loadTargets} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}</Button></div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {targets.map((t) => (<button key={t.id} onClick={() => setSelected(t)} className={`w-full text-right p-3 rounded-lg transition ${selected?.id === t.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}><div className="font-medium truncate">{tab === "USER" ? t.fullName : t.title}</div></button>))}
                {!loading && targets.length === 0 && <p className="text-center text-muted-foreground py-8">لا توجد نتائج</p>}
              </div>
            </CardContent></Card>
            <Card><CardContent className="p-6">
              {selected ? (
                <div className="space-y-6">
                  <div className="p-3 bg-muted rounded-lg"><div className="font-medium">{tab === "USER" ? selected.fullName : selected.title}</div></div>
                  <div><label className="text-sm font-medium block mb-2">الحقل:</label><div className="grid grid-cols-2 gap-2">{FIELDS[tab].map((f) => (<button key={f.key} onClick={() => setField(f.key)} className={`flex items-center gap-2 p-3 rounded-lg border transition ${field === f.key ? "border-primary bg-primary/10" : "hover:bg-muted"}`}><f.icon className="w-4 h-4" /><span>{f.label}</span></button>))}</div></div>
                  <div><label className="text-sm font-medium block mb-2">الكمية:</label><Input type="number" value={amount} onChange={(e) => setAmount(parseInt(e.target.value) || 0)} min={1} max={100000} /><div className="flex gap-2 mt-2 flex-wrap">{[10, 50, 100, 500, 1000, 5000].map((n) => (<button key={n} onClick={() => setAmount(n)} className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded-full">+{n}</button>))}</div></div>
                  <Input placeholder="السبب (اختياري)" value={reason} onChange={(e) => setReason(e.target.value)} />
                  <Button onClick={handleBoost} disabled={!field || !amount || boostLoading} className="w-full bg-gradient-to-r from-red-500 via-green-500 to-purple-600" size="lg">{boostLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}<TrendingUp className="w-4 h-4 mr-2" />زيادة {amount} {FIELDS[tab].find(f => f.key === field)?.label}</Button>
                </div>
              ) : (<div className="text-center py-16 text-muted-foreground"><TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>اختر من القائمة</p></div>)}
            </CardContent></Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card><CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5" /> إضافة تعليقات جاهزة</h3>
              <div className="space-y-4">
                <select value={commentTargetType} onChange={(e) => setCommentTargetType(e.target.value)} className="w-full p-3 border rounded-lg bg-background"><option value="VIDEO">فيديو</option><option value="ARTICLE">مقال</option><option value="EVENT">فعالية</option></select>
                <Input placeholder="الصق ID المحتوى" value={commentTargetId} onChange={(e) => setCommentTargetId(e.target.value)} dir="ltr" />
                <Input type="number" value={commentCount} onChange={(e) => setCommentCount(parseInt(e.target.value) || 0)} min={1} max={100} />
                <div className="flex gap-2 flex-wrap">{[5, 10, 20, 50, 100].map((n) => (<button key={n} onClick={() => setCommentCount(n)} className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded-full">{n}</button>))}</div>
                <Button onClick={handleAddComments} disabled={!commentTargetId || !commentCount || addingComments} className="w-full bg-gradient-to-r from-red-500 via-green-500 to-purple-600" size="lg">{addingComments && <Loader2 className="w-4 h-4 animate-spin mr-2" />}<Zap className="w-4 h-4 mr-2" />إضافة {commentCount} تعليق</Button>
              </div>
            </CardContent></Card>
            <Card><CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4">القوالب الجاهزة ({templates.length})</h3>
              <div className="max-h-[500px] overflow-y-auto space-y-2">{templates.map((t) => (<div key={t.id} className="p-3 bg-muted rounded-lg text-sm">{t.content}</div>))}</div>
            </CardContent></Card>
          </div>
        )}
      </Tabs>
    </div>
  );
}
