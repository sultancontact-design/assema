"use client";

// ===================================================================
//  AdsKpiCards — بطاقات مؤشرات الأداء لقسم الإعلانات
//  6 بطاقات: الإيرادات، النشطة، المشاهدات، النقرات، CTR، RPM
// ===================================================================

import { Card, CardContent } from "@/components/ui/card";
import {
  Wallet,
  Activity,
  Eye,
  MousePointerClick,
  TrendingUp,
  Gauge,
} from "lucide-react";
import { formatMAD, formatNumber, formatPercent } from "@/lib/constants";

export interface AdsKpis {
  totalRevenue: number;
  activeCount: number;
  totalViews: number;
  totalClicks: number;
  ctr: number;
  rpm: number;
}

export function AdsKpiCards({ kpis }: { kpis: AdsKpis }) {
  const items = [
    {
      icon: Wallet,
      label: "إجمالي الإيرادات",
      value: formatMAD(kpis.totalRevenue),
      hint: "مجموع المبالغ المدفوعة للحملات النشطة والمنتهية",
    },
    {
      icon: Activity,
      label: "الحملات النشطة",
      value: formatNumber(kpis.activeCount),
      hint: "الحملات التي تعرض حالياً على المنصة",
    },
    {
      icon: Eye,
      label: "إجمالي المشاهدات",
      value: formatNumber(kpis.totalViews),
      hint: "عدّاد مشاهدات كل الحملات",
    },
    {
      icon: MousePointerClick,
      label: "إجمالي النقرات",
      value: formatNumber(kpis.totalClicks),
      hint: "عدّاد نقرات كل الحملات",
    },
    {
      icon: TrendingUp,
      label: "معدّل النقر (CTR)",
      value: formatPercent(kpis.ctr, 2),
      hint: "النسبة بين النقرات والمشاهدات",
    },
    {
      icon: Gauge,
      label: "العائد لكل 1000 مشاهدة (RPM)",
      value: formatMAD(kpis.rpm),
      hint: "متوسط الإيراد لكل ألف مشاهدة",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.label}
            className="border border-border bg-card p-0"
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-md bg-accent/10 text-accent">
                  <Icon className="size-4" strokeWidth={1.5} />
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {item.label}
                </span>
              </div>
              <p className="mt-2 font-heading text-lg font-bold text-foreground md:text-xl">
                {item.value}
              </p>
              <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
                {item.hint}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
