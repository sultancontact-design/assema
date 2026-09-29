"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export function FollowButton({
  targetId,
  currentUserId,
  initialFollowing = false,
}: {
  targetId: string;
  currentUserId?: string;
  initialFollowing?: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (!currentUserId || currentUserId === targetId) return;
    fetch(`/api/follow/status?targetId=${targetId}`)
      .then(r => r.json())
      .then(d => setFollowing(d.following))
      .catch(() => {});
  }, [targetId, currentUserId]);

  if (!currentUserId || currentUserId === targetId) return null;

  const toggle = async () => {
    setLoading(true);
    const newFollowing = !following;
    setFollowing(newFollowing);
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: targetId }),
      });
      const data = await res.json();
      setFollowing(data.following);
    } catch {
      setFollowing(!newFollowing);
    } finally {
      setLoading(false);
    }
  };

  const styles = following
    ? "bg-muted text-foreground hover:bg-destructive/10 hover:text-destructive border-2 border-border"
    : "bg-gradient-to-r from-red-500 via-green-500 to-purple-600 text-white border-2 border-transparent";

  return (
    <motion.button
      onClick={toggle}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      disabled={loading}
      whileTap={{ scale: 0.95 }}
      className={`rounded-full font-bold transition-all px-5 py-2 text-sm flex items-center gap-1.5 disabled:opacity-50 ${styles}`}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : following ? (
        <>
          <UserCheck className="w-3 h-3" />
          {hovering ? "إلغاء المتابعة" : "متابَع"}
        </>
      ) : (
        <>
          <UserPlus className="w-3 h-3" />
          متابعة
        </>
      )}
    </motion.button>
  );
}
