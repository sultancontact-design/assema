"use client";

// ===================================================================
//  AuditLogFilters — فلاتر سجل النشاط (بحث + خطورة + نطاق تاريخ)
//  يحدّث الـURL searchParams عبر useRouter().replace
// ===================================================================

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function AuditLogFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // قراءة الفلاتر الحالية من الـURL
  const currentAction = searchParams.get("action") ?? "";
  const currentSeverity = searchParams.get("severity") ?? "ALL";
  const currentFrom = searchParams.get("from") ?? "";
  const currentTo = searchParams.get("to") ?? "";

  // debounce محلي للبحث قبل تحديث الـURL
  const [actionLocal, setActionLocal] = React.useState(currentAction);
  React.useEffect(() => {
    setActionLocal(currentAction);
  }, [currentAction]);

  React.useEffect(() => {
    const t = setTimeout(() => {
      if (actionLocal !== currentAction) {
        const params = new URLSearchParams(searchParams.toString());
        if (actionLocal.trim()) {
          params.set("action", actionLocal.trim());
        } else {
          params.delete("action");
        }
        router.replace(`/admin/audit?${params.toString()}`);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [actionLocal, currentAction, router, searchParams]);

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/admin/audit?${params.toString()}`);
  }

  function clearAll() {
    router.replace("/admin/audit");
    setActionLocal("");
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
        {/* بحث بالفعل */}
        <div className="relative flex-1 lg:max-w-xs">
          <Search
            className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
          />
          <Input
            type="text"
            value={actionLocal}
            onChange={(e) => setActionLocal(e.target.value)}
            placeholder="ابحث عن فعل (مثل: fund.contribution.confirmed)"
            className="h-10 ps-9"
            aria-label="بحث عن فعل"
            dir="ltr"
          />
        </div>

        {/* خطورة */}
        <Select
          value={currentSeverity}
          onValueChange={(v) => update("severity", v)}
        >
          <SelectTrigger className="h-10 w-full lg:w-40" aria-label="فلتر الخطورة">
            <SelectValue placeholder="كل المستويات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">كل المستويات</SelectItem>
            <SelectItem value="info">معلومة</SelectItem>
            <SelectItem value="warning">تحذير</SelectItem>
            <SelectItem value="critical">حرج</SelectItem>
          </SelectContent>
        </Select>

        {/* من تاريخ */}
        <div className="relative flex-1 lg:max-w-44">
          <Calendar
            className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
          />
          <Input
            type="date"
            value={currentFrom}
            onChange={(e) => update("from", e.target.value)}
            className="h-10 ps-9"
            aria-label="من تاريخ"
          />
        </div>

        {/* إلى تاريخ */}
        <div className="relative flex-1 lg:max-w-44">
          <Calendar
            className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
          />
          <Input
            type="date"
            value={currentTo}
            onChange={(e) => update("to", e.target.value)}
            className="h-10 ps-9"
            aria-label="إلى تاريخ"
          />
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-10"
        onClick={clearAll}
      >
        مسح الفلاتر
      </Button>
    </div>
  );
}
