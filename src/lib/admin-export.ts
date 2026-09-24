// ===================================================================
//  admin-export — أدوات تصدير العميل (client-safe)
//  - exportSheet: تصدير إلى ملف xlsx/csv على قرص العميل (تنزيل)
//  - roleLabel / shortDate / formatPoints: دوال عرض آمنة
//  لا يستورد db/auth — آمن للاستعمال في مكوّنات العميل
// ===================================================================

import * as XLSX from "xlsx";
import { ROLE_LABELS, formatNumber } from "@/lib/constants";
import type { Role } from "@prisma/client";

// -------------------------------------------------------------------
//  تصدير صفّ واحد إلى ملف على قرص العميل (تنزيل)
// -------------------------------------------------------------------

export function exportSheet(
  rows: Record<string, unknown>[],
  fileName: string,
  sheetName = "البيانات",
  bookType: "xlsx" | "csv" = "xlsx"
) {
  if (rows.length === 0) {
    rows = [{ ملاحظة: "لا توجد بيانات للتصدير" }];
  }
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.${bookType}`, { bookType });
}

// -------------------------------------------------------------------
//  تسمية دور بالعربية (آمنة مع القيم غير المعروفة)
// -------------------------------------------------------------------

export function roleLabel(role: Role | string): string {
  if (typeof role === "string" && role in ROLE_LABELS) {
    return ROLE_LABELS[role as Role].label;
  }
  return role;
}

// -------------------------------------------------------------------
//  helper لتحويل تاريخ ISO إلى نص مختصر
// -------------------------------------------------------------------

export function shortDate(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = typeof iso === "string" ? new Date(iso) : iso;
    return d.toISOString().slice(0, 10);
  } catch {
    return "—";
  }
}

export function formatPoints(value: number): string {
  return formatNumber(value);
}
