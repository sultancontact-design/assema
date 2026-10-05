"use client";

import * as React from "react";
import Link from "next/link";
import { Users, Newspaper, CalendarDays, LayoutGrid, UserPlus, UserCheck, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Tab = "all" | "members" | "groups" | "events";

export function CommunityTabs({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tab, setTab] = React.useState<Tab>("all");

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {([
          { id: "all" as const, label: "الكل", icon: LayoutGrid },
          { id: "members" as const, label: "الأعضاء", icon: Users },
          { id: "groups" as const, label: "المجموعات", icon: Newspaper },
          { id: "events" as const, label: "الفعاليات", icon: CalendarDays },
        ]).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors shrink-0 ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "all" && <>{children}</>}
      {tab === "members" && <MembersTab />}
      {tab === "groups" && <GroupsTab />}
      {tab === "events" && <EventsTab />}
    </div>
  );
}

function MembersTab() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [followingSet, setFollowingSet] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    fetch("/api/users/list?limit=24")
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users || []);
        if (d.users) setFollowingSet(new Set(d.users.filter((u: any) => u.isFollowing).map((u: any) => u.id)));
      })
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

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (users.length === 0) return <div className="text-center py-12 text-muted-foreground">لا يوجد أعضاء</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {users.map((u: any) => {
        const isFollowing = followingSet.has(u.id);
        return (
          <Card key={u.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <Link href={`/u/${u.id}`}>
                <Avatar className="size-12">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">
                    {(u.fullName || "U").slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/u/${u.id}`} className="font-semibold text-sm text-foreground hover:text-primary">
                  {u.fullName}
                </Link>
                {u.district?.nameAr && (
                  <p className="text-xs text-muted-foreground">{u.district.nameAr}</p>
                )}
                <p className="text-xs text-muted-foreground">{u.followersCount || 0} متابع</p>
              </div>
              <Button
                size="sm"
                variant={isFollowing ? "outline" : "default"}
                onClick={() => toggleFollow(u.id)}
                className="h-8 text-xs shrink-0"
              >
                {isFollowing ? (
                  <><UserCheck className="size-3 me-1" />متابَع</>
                ) : (
                  <><UserPlus className="size-3 me-1" />متابعة</>
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function GroupsTab() {
  const [groups, setGroups] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/community/groups")
      .then((r) => r.json())
      .then((d) => setGroups(d.groups || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (groups.length === 0) return <div className="text-center py-12 text-muted-foreground">لا توجد مجموعات</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {groups.map((g: any) => (
        <Card key={g.id} className="overflow-hidden hover:shadow-md transition-shadow">
          {g.imageUrl && (
            <div className="h-32 overflow-hidden">
              <img src={g.imageUrl} alt={g.name} className="w-full h-full object-cover" />
            </div>
          )}
          <CardContent className="p-4">
            <h3 className="font-bold text-sm mb-1">{g.name}</h3>
            {g.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{g.description}</p>}
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-[10px]">{g.memberCount || 0} عضو</Badge>
              <Link href={`/community/discussions/${g.id}`}>
                <Button size="sm" variant="outline" className="h-8 text-xs">عرض</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EventsTab() {
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/community/events?take=12")
      .then((r) => r.json())
      .then((d) => setEvents(d.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (events.length === 0) return <div className="text-center py-12 text-muted-foreground">لا توجد فعاليات</div>;

  return (
    <div className="space-y-3">
      {events.map((e: any) => (
        <Card key={e.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex gap-4">
            <div className="flex flex-col items-center justify-center size-16 shrink-0 rounded-lg bg-primary/10 text-primary">
              <span className="text-[10px] font-bold">
                {new Date(e.startDate).toLocaleDateString("ar-MA", { month: "short" })}
              </span>
              <span className="font-heading text-2xl font-bold">
                {new Date(e.startDate).getDate()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm mb-1">{e.title}</h3>
              {e.location && <p className="text-xs text-muted-foreground mb-1">{e.location}</p>}
              <Badge variant="outline" className="text-[10px]">{e.type}</Badge>
            </div>
            <Link href={`/community/events/${e.id}`}>
              <Button size="sm" variant="outline" className="h-8 text-xs shrink-0">تفاصيل</Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
