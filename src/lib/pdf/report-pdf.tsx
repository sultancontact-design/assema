// ===================================================================
//  report-pdf — تقرير إعلانات قابل للعرض كـPDF
//  ملخّص فترة زمنية مع إحصاءات + جدول + إجمالي
// ===================================================================

import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { AdPackage, AdStatus } from "@prisma/client";
import { AD_PACKAGE_LABELS, AD_STATUS_LABELS } from "@/lib/constants";

// ===================================================================
//  تسجيل الخط العربي — قراءة woff من node_modules على القرص
// ===================================================================

let fontRegistered = false;
function ensureArabicFont() {
  if (fontRegistered) return;
  fontRegistered = true;
  try {
    const normalPath = resolve(
      process.cwd(),
      "node_modules/@fontsource/tajawal/files/tajawal-arabic-400-normal.woff"
    );
    const boldPath = resolve(
      process.cwd(),
      "node_modules/@fontsource/tajawal/files/tajawal-arabic-700-normal.woff"
    );
    const normalBuf = readFileSync(normalPath);
    const boldBuf = readFileSync(boldPath);
    const normalDataUrl = `data:font/woff;base64,${normalBuf.toString("base64")}`;
    const boldDataUrl = `data:font/woff;base64,${boldBuf.toString("base64")}`;
    Font.register({
      family: "Tajawal",
      fonts: [
        { src: normalDataUrl, fontWeight: "normal" },
        { src: boldDataUrl, fontWeight: "bold" },
      ],
    });
  } catch {
    // تجاهل — سنستخدم Helvetica الافتراضي
  }
}

ensureArabicFont();

// ===================================================================
//  الأنواع
// ===================================================================

export interface ReportPdfData {
  organization: string;
  periodLabel: string; // "1 يناير 2025 — 31 يناير 2025"
  filtersLabel?: string; // "شهري"
  stats: {
    revenue: number;
    impressions: number;
    clicks: number;
    ctr: number; // %
    rpm: number; // درهم لكل 1000 مشاهدة
  };
  byPackage: Array<{ name: string; revenue: number; count: number }>;
  byStatus: Array<{ name: string; value: number; status: AdStatus }>;
  monthlySeries: Array<{ month: string; revenue: number }>;
  topAds: Array<{
    title: string;
    advertiser: string;
    package: AdPackage;
    status: AdStatus;
    amount: number;
    views: number;
    clicks: number;
  }>;
}

// ===================================================================
//  الأنماط
// ===================================================================

const styles = StyleSheet.create({
  page: {
    direction: "rtl",
    fontFamily: "Tajawal",
    fontSize: 10,
    padding: 40,
    color: "#1F1A17",
    backgroundColor: "#FFFFFF",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#C8842A",
    paddingBottom: 12,
    marginBottom: 20,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F1A17",
    marginBottom: 4,
  },
  reportTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#C8842A",
    marginTop: 8,
  },
  periodLabel: {
    fontSize: 10,
    color: "#6B5D4E",
    marginTop: 4,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#C8842A",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5DDD0",
    paddingBottom: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statCard: {
    width: "32%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#E5DDD0",
    borderRadius: 6,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 9,
    color: "#6B5D4E",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F1A17",
  },
  table: {
    borderWidth: 1,
    borderColor: "#E5DDD0",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#FBF6EE",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5DDD0",
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#6B5D4E",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1EBDD",
  },
  tableCell: { fontSize: 9, color: "#1F1A17" },
  colWide: { flex: 3 },
  colMid: { flex: 2 },
  colNarrow: { flex: 1.2 },
  footer: {
    marginTop: 30,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5DDD0",
    textAlign: "center",
  },
  footerText: { fontSize: 9, color: "#6B5D4E" },
});

// ===================================================================
//  المُكوّن
// ===================================================================

export function ReportPdfDocument({ data }: { data: ReportPdfData }) {
  const { organization, periodLabel, filtersLabel, stats, byPackage, byStatus, monthlySeries, topAds } = data;
  const amountFormatter = new Intl.NumberFormat("ar-MA", { maximumFractionDigits: 2 });
  const intFormatter = new Intl.NumberFormat("ar-MA");

  return (
    <Document title="تقرير الإعلانات" author={organization}>
      <Page size="A4" style={styles.page}>
        {/* الترويسة */}
        <View style={styles.header}>
          <Text style={styles.brandName}>{organization}</Text>
          <Text style={styles.reportTitle}>تقرير الإعلانات</Text>
          <Text style={styles.periodLabel}>الفترة: {periodLabel}</Text>
          {filtersLabel && (
            <Text style={styles.periodLabel}>النوع: {filtersLabel}</Text>
          )}
        </View>

        {/* مؤشرات الأداء */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>مؤشرات الأداء</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>إجمالي الإيرادات</Text>
              <Text style={styles.statValue}>
                {amountFormatter.format(stats.revenue)} د.م
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>إجمالي المشاهدات</Text>
              <Text style={styles.statValue}>{intFormatter.format(stats.impressions)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>إجمالي النقرات</Text>
              <Text style={styles.statValue}>{intFormatter.format(stats.clicks)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>معدّل النقر (CTR)</Text>
              <Text style={styles.statValue}>{stats.ctr.toFixed(2)}%</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>العائد لكل 1000 مشاهدة (RPM)</Text>
              <Text style={styles.statValue}>
                {amountFormatter.format(stats.rpm)} د.م
              </Text>
            </View>
          </View>
        </View>

        {/* الإيرادات حسب الباقة */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الإيرادات حسب الباقة</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colWide]}>الباقة</Text>
              <Text style={[styles.tableHeaderCell, styles.colNarrow]}>عدد الحملات</Text>
              <Text style={[styles.tableHeaderCell, styles.colMid]}>الإيراد</Text>
            </View>
            {byPackage.map((row, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colWide]}>{row.name}</Text>
                <Text style={[styles.tableCell, styles.colNarrow]}>
                  {intFormatter.format(row.count)}
                </Text>
                <Text style={[styles.tableCell, styles.colMid]}>
                  {amountFormatter.format(row.revenue)} د.م
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* توزيع الحملات حسب الحالة */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>توزيع الحملات حسب الحالة</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colWide]}>الحالة</Text>
              <Text style={[styles.tableHeaderCell, styles.colNarrow]}>العدد</Text>
            </View>
            {byStatus.map((row, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colWide]}>{row.name}</Text>
                <Text style={[styles.tableCell, styles.colNarrow]}>
                  {intFormatter.format(row.value)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* سلسلة الإيرادات الشهرية */}
        {monthlySeries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الإيرادات الشهرية</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colWide]}>الشهر</Text>
                <Text style={[styles.tableHeaderCell, styles.colMid]}>الإيراد</Text>
              </View>
              {monthlySeries.map((row, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colWide]}>{row.month}</Text>
                  <Text style={[styles.tableCell, styles.colMid]}>
                    {amountFormatter.format(row.revenue)} د.م
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* أبرز الحملات */}
        {topAds.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>أبرز الحملات</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colWide]}>الحملة</Text>
                <Text style={[styles.tableHeaderCell, styles.colMid]}>الباقة</Text>
                <Text style={[styles.tableHeaderCell, styles.colNarrow]}>المبلغ</Text>
              </View>
              {topAds.slice(0, 8).map((ad, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colWide]}>{ad.title}</Text>
                  <Text style={[styles.tableCell, styles.colMid]}>
                    {AD_PACKAGE_LABELS[ad.package].label}
                  </Text>
                  <Text style={[styles.tableCell, styles.colNarrow]}>
                    {amountFormatter.format(ad.amount)} د.م
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* التذييل */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            تم توليد هذا التقرير آلياً من منصة {organization} — {periodLabel}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
