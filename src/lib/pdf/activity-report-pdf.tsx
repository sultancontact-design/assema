// ===================================================================
//  activity-report-pdf — تقرير النشاط الأسبوعي
//  - تسجيلات، مساهمات، فعاليات
//  - جدول + إحصاءات
// ===================================================================

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { ensureArabicFont, PDF_COLORS } from "./arabic-font";

ensureArabicFont();

export interface ActivityReportPdfData {
  organization: string;
  periodLabel: string;
  filtersLabel?: string;
  summary: {
    newMembers: number;
    newContributions: number;
    newRequests: number;
    eventsCount: number;
  };
  rows: Array<{
    week: string;
    newMembers: number;
    newContributions: number;
    newRequests: number;
    events: number;
  }>;
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

export function ActivityReportPdfDocument({
  data,
}: {
  data: ActivityReportPdfData;
}) {
  const { organization, periodLabel, filtersLabel, summary, rows } = data;
  const intFormatter = new Intl.NumberFormat("ar-MA");

  return (
    <Document title="تقرير النشاط" author={organization}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brandName}>{organization}</Text>
          <Text style={styles.reportTitle}>تقرير النشاط الأسبوعي</Text>
          <Text style={styles.periodLabel}>الفترة: {periodLabel}</Text>
          {filtersLabel && (
            <Text style={styles.periodLabel}>النوع: {filtersLabel}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ملخّص النشاط</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>أعضاء جدد</Text>
              <Text style={styles.statValue}>{intFormatter.format(summary.newMembers)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>مساهمات جديدة</Text>
              <Text style={styles.statValue}>
                {intFormatter.format(summary.newContributions)}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>طلبات جديدة</Text>
              <Text style={styles.statValue}>{intFormatter.format(summary.newRequests)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>عدد الفعاليات</Text>
              <Text style={styles.statValue}>{intFormatter.format(summary.eventsCount)}</Text>
            </View>
          </View>
        </View>

        {rows.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>تفصيل النشاط الأسبوعي</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colWide]}>الأسبوع</Text>
                <Text style={[styles.tableHeaderCell, styles.colNarrow]}>أعضاء جدد</Text>
                <Text style={[styles.tableHeaderCell, styles.colNarrow]}>مساهمات</Text>
                <Text style={[styles.tableHeaderCell, styles.colNarrow]}>طلبات</Text>
                <Text style={[styles.tableHeaderCell, styles.colNarrow]}>فعاليات</Text>
              </View>
              {rows.map((row, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colWide]}>{row.week}</Text>
                  <Text style={[styles.tableCell, styles.colNarrow]}>
                    {intFormatter.format(row.newMembers)}
                  </Text>
                  <Text style={[styles.tableCell, styles.colNarrow]}>
                    {intFormatter.format(row.newContributions)}
                  </Text>
                  <Text style={[styles.tableCell, styles.colNarrow]}>
                    {intFormatter.format(row.newRequests)}
                  </Text>
                  <Text style={[styles.tableCell, styles.colNarrow]}>
                    {intFormatter.format(row.events)}
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
