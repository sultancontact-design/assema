"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Phone, MapPin, Search, Plus, BadgeCheck } from "lucide-react";
import { toast } from "sonner";

interface ServiceItem {
  id: string; title: string; titleAr: string; description: string;
  category: string; subcategory?: string | null; phone?: string | null;
  whatsapp?: string | null; address?: string | null; price?: string | null;
  rating: number; reviews: number; isVerified: boolean; reviewCount: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  PROFESSION: "🔧", CRAFT: "🎨", HEALTH: "🏥", EDUCATION: "📚", ADVICE: "💡",
};

export function ServicesDirectory({ services, categories }: { services: ServiceItem[]; categories: { value: string; label: string; icon: string }[] }) {
  const [search, setSearch] = React.useState("");
  const [activeCat, setActiveCat] = React.useState<string>("ALL");
  const [showAdd, setShowAdd] = React.useState(false);

  const filtered = services.filter(s => {
    const matchCat = activeCat === "ALL" || s.category === activeCat;
    const matchSearch = !search || s.titleAr.includes(search) || s.title.includes(search) || s.description.includes(search);
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن خدمة..." className="ps-9 h-11" />
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="h-11"><Plus className="size-4" /> أضف خدمة</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveCat("ALL")} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeCat === "ALL" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>الكل</button>
        {categories.map(c => (
          <button key={c.value} onClick={() => setActiveCat(c.value)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeCat === c.value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {showAdd && (
        <Card><CardContent className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">لإضافة خدمة، تواصل مع إدارة الحي. النموذج الكامل متاح قريباً.</p>
          <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>إغلاق</Button>
        </CardContent></Card>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">لا توجد خدمات في هذا التصنيف بعد</p>
          <p className="text-sm mt-1">كن أول من يضيف خدمة!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(s => (
            <Card key={s.id} className="lift-on-hover">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{CATEGORY_ICONS[s.category] || "📋"}</span>
                    <div>
                      <h3 className="font-heading font-bold text-foreground">{s.titleAr || s.title}</h3>
                      {s.subcategory && <p className="text-xs text-muted-foreground">{s.subcategory}</p>}
                    </div>
                  </div>
                  {s.isVerified && <BadgeCheck className="size-5 text-secondary" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {s.rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="size-3 fill-accent text-accent" /> {s.rating.toFixed(1)} ({s.reviewCount})
                    </span>
                  )}
                  {s.phone && <span className="flex items-center gap-1"><Phone className="size-3" /> 06XX-XX-XX</span>}
                  {s.address && <span className="flex items-center gap-1"><MapPin className="size-3" /> {s.address.substring(0, 30)}</span>}
                </div>
                {s.price && <Badge variant="secondary" className="text-xs">{s.price}</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
