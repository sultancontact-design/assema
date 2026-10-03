"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, UserPlus, UserCheck, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function SuggestionsCard() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [followingSet, setFollowingSet] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    fetch("/api/users/suggestions?limit=5")
      .then((r) => r.json())
      .then((d) => setUsers(d.suggestions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleFollow = async (userId: string) => {
    const was = followingSet.has(userId);
    setFollowingSet((prev) => {
      const n = new Set(prev);
      was ? n.delete(userId) : n.add(userId);
      return n;
    });
    try {
      await fetch("/api/follow", {
        method: was ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: userId }),
      });
    } catch {
      setFollowingSet((prev) => {
        const n = new Set(prev);
        was ? n.add(userId) : n.delete(userId);
        return n;
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-center py-4">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="size-4 text-primary" />
          اقتراحات لك
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-2">
          {users.map((u) => {
            const isFollowing = followingSet.has(u.id);
            return (
              <li key={u.id} className="flex items-center gap-3">
                <Link href={`/u/${u.id}`}>
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs font-bold">
                      {(u.fullName || "U").slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/u/${u.id}`} className="text-sm font-medium text-foreground hover:text-primary truncate block">
                    {u.fullName}
                  </Link>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {u.profession || u.district?.nameAr || ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={isFollowing ? "outline" : "default"}
                  onClick={() => toggleFollow(u.id)}
                  className="h-7 text-[10px] px-2 shrink-0"
                >
                  {isFollowing ? (
                    <><UserCheck className="size-3" /></>
                  ) : (
                    <><UserPlus className="size-3" /></>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
        <Link href="/discover" className="block mt-3 text-center text-xs text-muted-foreground hover:text-primary">
          عرض الكل →
        </Link>
      </CardContent>
    </Card>
  );
}
