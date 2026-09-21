// ===================================================================
//  events-report-pdf — تقرير الفعاليات (حضور، تكلفة، رضا)
// ===================================================================

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { ensureArabicFont, PDF_COLORS } from "./arabic-font";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import type { EventType } from "@prisma/client";

ensureArabicFont();

export interface EventsReportPdfData {
  organization: string;
  periodLabel: string;
  summary: {
    totalEvents: number;
    totalRegistrations: number;
    totalAttended: number;
    attendanceRate: number; // %
  };
  rows: Array<{
    title: string;
    type: EventType;
    registrations: number;
    attended: number;
    absent: number;
    attendanceRate: number;
    cost: number;
  }>;
  distribution: Array<{ type: EventType; label: string; value: number }>;
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
  colNarrow: { flex: 1.2 },
  footer: {
    marginTop: 30,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.border,
    textAlign: "center",
  },
  footerText: { fontSize: 9, color: PDF_COLORS.muted },
});

export function EventsReportPdfDocument({
  data,
}: {
  data: EventsReportPdfData;
}) {
  const { organization, periodLabel, summary, rows, distribution } = data;
  const intFormatter = new Intl.NumberFormat("ar-MA");
  const amountFormatter = new Intl.NumberFormat("ar-MA", { maximumFractionDigits: 2 });

  return (
    <Document title="تقرير الفعاليات" author={organization}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brandName}>{organization}</Text>
          <Text style={styles.reportTitle}>تقرير الفعاليات</Text>
          <Text style={styles.periodLabel}>الفترة: {periodLabel}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>مؤشّرات الحضور</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>عدد الفعاليات</Text>
              <Text style={styles.statValue}>{intFormatter.format(summary.totalEvents)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>إجمالي المسجلين</Text>
              <Text style={styles.statValue}>
                {intFormatter.format(summary.totalRegistrations)}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>إجمالي الحضور</Text>
              <Text style={styles.statValue}>
                {intFormatter.format(summary.totalAttended)}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>نسبة الحضور</Text>
              <Text style={styles.statValue}>{summary.attendanceRate.toFixed(1)}%</Text>
            </View>
          </View>
        </View>

        {rows.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>تفصيل الفعاليات</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colWide]}>الفعالية</Text>
                <Text style={[styles.tableHeaderCell, styles.colNarrow]}>المسجلون</Text>
                <Text style={[styles.tableHeaderCell, styles.colNarrow]}>الحضور</Text>
                <Text style={[styles.tableHeaderCell, styles.colNarrow]}>النسبة</Text>
                <Text style={[styles.tableHeaderCell, styles.colNarrow]}>التكلفة</Text>
              </View>
              {rows.map((row, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colWide]}>{row.title}</Text>
                  <Text style={[styles.tableCell, styles.colNarrow]}>
                    {intFormatter.format(row.registrations)}
                  </Text>
                  <Text style={[styles.tableCell, styles.colNarrow]}>
                    {intFormatter.format(row.attended)}
                  </Text>
                  <Text style={[styles.tableCell, styles.colNarrow]}>
                    {row.attendanceRate.toFixed(1)}%
                  </Text>
                  <Text style={[styles.tableCell, styles.colNarrow]}>
                    {amountFormatter.format(row.cost)} د.م
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {distribution.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>توزيع الحضور حسب نوع الفعالية</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colWide]}>النوع</Text>
                <Text style={[styles.tableHeaderCell, styles.colNarrow]}>العدد</Text>
              </View>
              {distribution.map((row, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colWide]}>
                    {row.label || EVENT_TYPE_LABELS[row.type].label}
                  </Text>
                  <Text style={[styles.tableCell, styles.colNarrow]}>
                    {intFormatter.format(row.value)}
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
