"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck } from "lucide-react";

export function FollowButton({ targetId, targetType, initialFollowing = false }: {
  targetId: string;
  targetType: string;
  initialFollowing?: boolean;
}) {
  const [following, setFollowing] = React.useState(initialFollowing);
  const [loading, setLoading] = React.useState(false);

  const toggle = async () => {
    setLoading(true);
    setFollowing(!following);
    try {
      await fetch("/api/social/follow", {
        method: following ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, targetType }),
      });
    } catch { setFollowing(following); }
    setLoading(false);
  };

  return (
    <Button variant={following ? "outline" : "default"} size="sm" onClick={toggle} disabled={loading} className="gap-2">
      {following ? <><UserCheck className="w-4 h-4" />متابع</> : <><UserPlus className="w-4 h-4" />متابعة</>}
    </Button>
  );
}
