// ===================================================================
//  growth-report-pdf — تقرير نمو الأعضاء والعائلات
// ===================================================================

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { ensureArabicFont, PDF_COLORS } from "./arabic-font";

ensureArabicFont();

export interface GrowthReportPdfData {
  organization: string;
  periodLabel: string;
  summary: {
    growthThisMonth: number; // %
    avgMonthlyGrowth: number; // %
    totalMembers: number;
    totalFamilies: number;
  };
  memberSeries: Array<{ month: string; members: number; families: number }>;
}

const styles = StyleSheet.create({
  page: {
    direction: "rtl",
    fontFamily: "Tajawal",
    fontSize: 10,
    padding: 40,
    color: PDF_COLORS.text,
    backgroundColor: PDF_COLORS.bg,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: PDF_COLORS.accent,
    paddingBottom: 12,
    marginBottom: 20,
  },
  brandName: { fontSize: 18, fontWeight: "bold", color: PDF_COLORS.text, marginBottom: 4 },
  reportTitle: { fontSize: 22, fontWeight: "bold", color: PDF_COLORS.accent, marginTop: 8 },
  periodLabel: { fontSize: 10, color: PDF_COLORS.muted, marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
    paddingBottom: 4,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statCard: {
    width: "48%",
    padding: 10,
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    borderRadius: 6,
    marginBottom: 8,
  },
  statLabel: { fontSize: 9, color: PDF_COLORS.muted, marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: "bold", color: PDF_COLORS.text },
  table: {
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: PDF_COLORS.bgSoft,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
  },
  tableHeaderCell: { fontSize: 9, fontWeight: "bold", color: PDF_COLORS.muted },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.borderSoft,
  },
  tableCell: { fontSize: 9, color: PDF_COLORS.text },
  colWide: { flex: 3 },
  colNarrow: { flex: 1.6 },
  footer: {
    marginTop: 30,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.border,
    textAlign: "center",
  },
  footerText: { fontSize: 9, color: PDF_COLORS.muted },
});

export function GrowthReportPdfDocument({
  data,
}: {
  data: GrowthReportPdfData;
}) {
  const { organization, periodLabel, summary, memberSeries } = data;
  const intFormatter = new Intl.NumberFormat("ar-MA");

  return (
    <Document title="تقرير النمو" author={organization}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brandName}>{organization}</Text>
          <Text style={styles.reportTitle}>تقرير نمو الأعضاء والعائلات</Text>
          <Text style={styles.periodLabel}>الفترة: {periodLabel}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>مؤشّرات النمو</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>نمو هذا الشهر</Text>
              <Text style={styles.statValue}>{summary.growthThisMonth.toFixed(1)}%</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>متوسط النمو الشهري</Text>
              <Text style={styles.statValue}>{summary.avgMonthlyGrowth.toFixed(1)}%</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>إجمالي الأعضاء</Text>
              <Text style={styles.statValue}>{intFormatter.format(summary.totalMembers)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>إجمالي العائلات</Text>
              <Text style={styles.statValue}>{intFormatter.format(summary.totalFamilies)}</Text>
            </View>
          </View>
        </View>

        {memberSeries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>النمو عبر الأشهر</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colWide]}>الشهر</Text>
                <Text style={[styles.tableHeaderCell, styles.colNarrow]}>الأعضاء</Text>
                <Text style={[styles.tableHeaderCell, styles.colNarrow]}>العائلات</Text>
              </View>
              {memberSeries.map((row, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colWide]}>{row.month}</Text>
                  <Text style={[styles.tableCell, styles.colNarrow]}>
                    {intFormatter.format(row.members)}
                  </Text>
                  <Text style={[styles.tableCell, styles.colNarrow]}>
                    {intFormatter.format(row.families)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            تم توليد هذا التقرير آلياً من منصة {organization} — {periodLabel}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
