"use client";
import * as React from "react";
import { UserPlus, UserCheck } from "lucide-react";

export function FollowButtonInline({ targetId }: { targetId: string }) {
  const [following, setFollowing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/follow/status?targetId=${targetId}`).then(r => r.json()).then(d => setFollowing(d.following)).catch(() => {});
  }, [targetId]);

  const toggle = async () => {
    setLoading(true);
    const was = following;
    setFollowing(!was);
    try {
      await fetch("/api/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ followingId: targetId }) });
    } catch { setFollowing(was); }
    finally { setLoading(false); }
  };

  return (
    <button onClick={toggle} disabled={loading} className={`h-9 px-4 rounded-full text-xs font-bold min-h-[44px] flex items-center gap-1.5 transition-all ${following ? "bg-muted text-foreground border border-border" : "bg-gradient-to-r from-[#FE2C55] to-[#8B5CF6] text-white"}`}>
      {following ? <><UserCheck className="size-3" />متابَع</> : <><UserPlus className="size-3" />متابعة</>}
    </button>
  );
}
