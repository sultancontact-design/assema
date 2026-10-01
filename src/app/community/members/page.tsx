"use client";
import * as React from "react";
import Link from "next/link";
import { Search, Users, Loader2 } from "lucide-react";

export default function MembersPage() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [followingSet, setFollowingSet] = React.useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/list?q=${encodeURIComponent(query)}`, { cache: "no-store" });
      const d = await res.json();
      setUsers(d.users || []);
      setCurrentUserId(d.currentUserId ?? null);
      // Check follow status for each user
      if (d.currentUserId) {
        const statuses = await Promise.all(
          (d.users || []).slice(0, 20).map(async (u: any) => {
            const r = await fetch(`/api/follow/status?targetId=${u.id}`);
            const s = await r.json();
            return { id: u.id, following: s.following };
          })
        );
        setFollowingSet(new Set(statuses.filter(s => s.following).map(s => s.id)));
      }
    } catch {} finally { setLoading(false); }
  };

  React.useEffect(() => { load(); }, []);

  const toggleFollow = async (userId: string) => {
    const wasFollowing = followingSet.has(userId);
    setFollowingSet(prev => { const n = new Set(prev); wasFollowing ? n.delete(userId) : n.add(userId); return n; });
    try {
      await fetch("/api/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ followingId: userId }) });
    } catch { setFollowingSet(prev => { const n = new Set(prev); wasFollowing ? n.add(userId) : n.delete(userId); return n; }); }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="border-b border-border bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
        <div className="w-full max-w-[1400px] mx-auto px-4 py-8">
          <h1 className="text-3xl font-extrabold flex items-center gap-2"><Users className="size-7 text-primary" />أعضاء الحي</h1>
          <p className="text-muted-foreground mt-1">تابع أبناء الحي وتواصل معهم</p>
        </div>
      </div>
      <div className="w-full max-w-[1400px] mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6">
          <input type="text" placeholder="ابحث بالاسم..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && load()} className="flex-1 h-11 rounded-lg border border-input bg-background px-4 text-sm" />
          <button onClick={load} disabled={loading} className="px-4 h-11 rounded-lg bg-primary text-primary-foreground font-medium flex items-center gap-2 min-w-[44px] justify-center">{loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="size-8 animate-spin text-primary" /></div>
        ) : users.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">لا يوجد أعضاء بعد</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {users.map(u => (
              <div key={u.id} className="rounded-2xl border border-border p-4 text-center hover:shadow-lg transition-shadow">
                <Link href={`/community/profile?id=${u.id}`}>
                  <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden bg-gradient-to-br from-primary to-accent">
                    {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">{(u.name || "U").slice(0,1)}</div>}
                  </div>
                </Link>
                <Link href={`/community/profile?id=${u.id}`}><p className="font-bold text-sm truncate">{u.name}</p></Link>
                <p className="text-[10px] text-muted-foreground mb-1">{u.districtName || "—"}</p>
                <div className="flex justify-center gap-3 text-[10px] text-muted-foreground mb-3">
                  <span><strong className="text-foreground">{u.followersCount || 0}</strong> متابع</span>
                  <span>مستوى {u.level || 1}</span>
                </div>
                {currentUserId && u.id !== currentUserId && (
                  <button onClick={() => toggleFollow(u.id)} className={`w-full h-9 rounded-full text-xs font-bold transition-all min-h-[44px] ${followingSet.has(u.id) ? "bg-muted text-foreground border border-border" : "bg-gradient-to-r from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6] text-white"}`}>
                    {followingSet.has(u.id) ? "متابَع" : "متابعة"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
