"use client";
import * as React from "react";
import Link from "next/link";
import { Loader2, Heart } from "lucide-react";

export default function FollowersPage() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [followingSet, setFollowingSet] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    fetch("/api/follow/followers").then(r => r.json()).then(d => setUsers(d.users || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggleFollow = async (userId: string) => {
    const was = followingSet.has(userId);
    setFollowingSet(prev => { const n = new Set(prev); was ? n.delete(userId) : n.add(userId); return n; });
    await fetch("/api/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ followingId: userId }) }).catch(() => setFollowingSet(prev => { const n = new Set(prev); was ? n.add(userId) : n.delete(userId); return n; }));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="w-full max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Heart className="size-6 text-primary" />المتابِعون ({users.length})</h1>
        {users.length === 0 ? <p className="text-center text-muted-foreground py-16">لا يوجد متابعون بعد</p> : (
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30">
                <Link href={`/community/profile?id=${u.id}`}>
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent shrink-0">{u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold">{(u.name||"U").slice(0,1)}</div>}</div>
                </Link>
                <div className="flex-1 min-w-0"><Link href={`/community/profile?id=${u.id}`}><p className="font-bold text-sm truncate">{u.name}</p></Link><p className="text-xs text-muted-foreground">{u.districtName || "—"} · مستوى {u.level || 1}</p></div>
                <button onClick={() => toggleFollow(u.id)} className={`h-9 px-4 rounded-full text-xs font-bold min-h-[44px] ${followingSet.has(u.id) ? "bg-muted text-foreground border border-border" : "bg-primary text-primary-foreground"}`}>{followingSet.has(u.id) ? "متابَع" : "متابعة"}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
