"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, UserPlus, RefreshCw, Sparkles } from "lucide-react";

interface Recommendation {
  userId: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  region: { id: string; nameAr: string | null; name: string; slug: string } | null;
  city: { id: string; nameAr: string | null; name: string; slug: string } | null;
  score: number;
  reasons: string;
  sharedTags: string[];
}

interface Props {
  initialRecs: Recommendation[];
}

export function NetworkClient({ initialRecs }: Props) {
  const [recs, setRecs] = useState<Recommendation[]>(initialRecs);
  const [loading, setLoading] = useState(false);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  async function refreshRecs() {
    setLoading(true);
    try {
      const r = await fetch("/api/network/recommendations?limit=12");
      if (r.ok) {
        const data = await r.json();
        if (data.recommendations) setRecs(data.recommendations);
      }
    } catch (e) {
      console.error("refresh error", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleFollow(targetId: string) {
    setFollowedIds((prev) => new Set(prev).add(targetId));
    try {
      await fetch("/api/social/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: targetId }),
      });
    } catch (e) {
      console.error("follow error", e);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-teal-600" />
          توصيات التعارف
        </h2>
        <Button onClick={refreshRecs} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </div>

      {recs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="mb-2">لا توجد توصيات بعد.</p>
            <p className="text-sm">أضف اهتمامات ومهارات لملفك للحصول على توصيات أوضح.</p>
            <Button asChild variant="link">
              <Link href="/community/profile">تعديل الملف</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recs.map((rec) => {
            const followed = followedIds.has(rec.userId);
            return (
              <Card key={rec.userId} className="hover:border-teal-400 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
                        {(rec.name || "؟").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{rec.name || "مستخدم وَصَل"}</CardTitle>
                      {(rec.region || rec.city) && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {rec.city?.nameAr || rec.city?.name}
                          {rec.region ? " · " + rec.region.nameAr || rec.region.name : ""}
                        </p>
                      )}
                    </div>
                    {rec.score > 0 && (
                      <Badge variant="secondary" className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                        {(rec.score * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {rec.bio && <p className="text-xs text-muted-foreground line-clamp-2">{rec.bio}</p>}
                  <p className="text-xs font-medium text-teal-700 dark:text-teal-300">{rec.reasons}</p>
                  {rec.sharedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {rec.sharedTags.slice(0, 3).map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px] px-2 py-0">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Button
                    onClick={() => handleFollow(rec.userId)}
                    disabled={followed}
                    className="w-full gap-2"
                    variant={followed ? "secondary" : "default"}
                    size="sm"
                  >
                    <UserPlus className="h-4 w-4" />
                    {followed ? "تتم المتابعة" : "متابعة"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
