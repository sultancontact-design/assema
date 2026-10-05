"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Filter, Plus, Search } from "lucide-react";

interface Report {
  id: string;
  reportNumber: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  region: { nameAr: string | null; name: string; slug: string } | null;
  reportedByName: string | null;
  upvotes: number;
  viewsCount: number;
  isVerified: boolean;
  publishedAt: string | null;
  resolutionNote: string | null;
}

interface Props {
  reports: Report[];
  categoryLabels: Record<string, string>;
  statusLabels: Record<string, { label: string; color: string }>;
  priorityLabels: Record<string, string>;
}

export function CivicReportsClient({ reports, categoryLabels, statusLabels, priorityLabels }: Props) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeStatus, setActiveStatus] = useState("all");
  const [query, setQuery] = useState("");

  const categories = useMemo(() => {
    const set = new Set(reports.map((r) => r.category));
    return ["all", ...Array.from(set)];
  }, [reports]);

  const statuses = ["all", "submitted", "verified", "assigned", "in_progress", "resolved"];

  const filtered = useMemo(() => {
    let list = reports;
    if (activeCategory !== "all") list = list.filter((r) => r.category === activeCategory);
    if (activeStatus !== "all") list = list.filter((r) => r.status === activeStatus);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((r) =>
        r.title.toLowerCase().includes(q) || (r.description?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [reports, activeCategory, activeStatus, query]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">الفئة:</span>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                activeCategory === c ? "bg-teal-700 text-white border-teal-700" : "bg-background hover:bg-muted border-muted-foreground/20"
              }`}
            >
              {c === "all" ? "الكل" : categoryLabels[c] ?? c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">الحالة:</span>
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                activeStatus === s ? "bg-amber-700 text-white border-amber-700" : "bg-background hover:bg-muted border-muted-foreground/20"
              }`}
            >
              {s === "all" ? "الكل" : statusLabels[s]?.label ?? s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث في البلاغات..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            بلاغ جديد
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">لا توجد بلاغات مطابقة</CardContent></Card>
        ) : (
          filtered.map((r) => (
            <Card key={r.id} className="hover:border-teal-300 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{r.reportNumber}</span>
                      <Badge variant="outline" className="text-[10px]">{categoryLabels[r.category] ?? r.category}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${statusLabels[r.status]?.color ?? ""}`}>{statusLabels[r.status]?.label ?? r.status}</Badge>
                      {r.priority === "critical" && (
                        <Badge variant="outline" className="text-[10px] text-rose-700 border-rose-300 bg-rose-50">حرج</Badge>
                      )}
                      {r.priority === "high" && (
                        <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50">عالٍ</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold">{r.title}</h3>
                  </div>
                  {r.isVerified && (
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 shrink-0">
                      موثّق
                    </Badge>
                  )}
                </div>
                {r.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{r.description}</p>}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {r.region && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.region.nameAr || r.region.name}</span>
                  )}
                  {r.reportedByName && <span>· بلّغ: {r.reportedByName}</span>}
                  {r.upvotes > 0 && <span>· {r.upvotes} تأييد</span>}
                  {r.viewsCount > 0 && <span>· {r.viewsCount} مشاهدة</span>}
                  {r.resolutionNote && <span className="text-emerald-700 dark:text-emerald-300">· حل: {r.resolutionNote}</span>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
