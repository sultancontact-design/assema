// ===================================================================
//  financial-report-pdf — تقرير مالي شامل قابل للعرض كـPDF
//  - المساهمات، الصرف، الرصيد
//  - جدول الفترات (يومي/أسبوعي/شهري/سنوي)
//  - سلسلة 12 شهراً
// ===================================================================

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { ensureArabicFont, PDF_COLORS } from "./arabic-font";

ensureArabicFont();

// ===================================================================
//  الأنواع
// ===================================================================

export interface FinancialReportPdfData {
  organization: string;
  periodLabel: string;
  filtersLabel?: string;
  summary: {
    totalContributions: number;
    totalDisbursed: number;
    balance: number;
    operationsCount: number;
  };
  rows: Array<{
    period: string;
    contributions: number;
    disbursed: number;
    balance: number;
    operations: number;
  }>;
  monthlySeries: Array<{ month: string; contributions: number; disbursed: number }>;
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
    color: PDF_COLORS.text,
    backgroundColor: PDF_COLORS.bg,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: PDF_COLORS.accent,
    paddingBottom: 12,
    marginBottom: 20,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "bold",
    color: PDF_COLORS.text,
    marginBottom: 4,
  },
  reportTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
    marginTop: 8,
  },
  periodLabel: {
    fontSize: 10,
    color: PDF_COLORS.muted,
    marginTop: 4,
  },
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statCard: {
    width: "48%",
    padding: 10,
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    borderRadius: 6,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 9,
    color: PDF_COLORS.muted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: PDF_COLORS.text,
  },
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
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: "bold",
    color: PDF_COLORS.muted,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.borderSoft,
  },
  tableCell: { fontSize: 9, color: PDF_COLORS.text },
  colWide: { flex: 3 },
  colNarrow: { flex: 1.4 },
  footer: {
    marginTop: 30,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.border,
    textAlign: "center",
  },
  footerText: { fontSize: 9, color: PDF_COLORS.muted },
});

// ===================================================================
//  المُكوّن
// ===================================================================

export function FinancialReportPdfDocument({
  data,
}: {
  data: FinancialReportPdfData;
}) {
  const { organization, periodLabel, filtersLabel, summary, rows, monthlySeries } = data;
  const amountFormatter = new Intl.NumberFormat("ar-MA", { maximumFractionDigits: 2 });
  const intFormatter = new Intl.NumberFormat("ar-MA");

  return (
    <Document title="التقرير المالي" author={organization}>
      <Page size="A4" style={styles.page}>
        {/* الترويسة */}
        <View style={styles.header}>
          <Text style={styles.brandName}>{organization}</Text>
          <Text style={styles.reportTitle}>التقرير المالي الشامل</Text>
          <Text style={styles.periodLabel}>الفترة: {periodLabel}</Text>
          {filtersLabel && (
            <Text style={styles.periodLabel}>النوع: {filtersLabel}</Text>
          )}
        </View>

        {/* الملخّص */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ملخّص الحساب</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>إجمالي المساهمات</Text>
              <Text style={styles.statValue}>
                {amountFormatter.format(summary.totalContributions)} د.م
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>إجمالي الصرف</Text>
              <Text style={styles.statValue}>
                {amountFormatter.format(summary.totalDisbursed)} د.م
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>الرصيد الحالي</Text>
              <Text style={styles.statValue}>
                {amountFormatter.format(summary.balance)} د.م
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>عدد العمليات</Text>
              <Text style={styles.statValue}>
                {intFormatter.format(summary.operationsCount)}
              </Text>
            </View>
          </View>
        </View>

        {/* جدول الفترات */}
        {rows.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>تفصيل الفترات</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colWide]}>الفترة</Text>
                <Text style={[styles.tableHeaderCell, styles.colNarrow]}>المساهمات</Text>
                <Text style={[styles.tableHeaderCell, styles.colNarrow]}>الصرف</Text>
                <Text style={[styles.tableHeaderCell, styles.colNarrow]}>الرصيد</Text>
                <Text style={[styles.tableHeaderCell, styles.colNarrow]}>العمليات</Text>
              </View>
              {rows.map((row, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colWide]}>{row.period}</Text>
                  <Text style={[styles.tableCell, styles.colNarrow]}>
                    {amountFormatter.format(row.contributions)} د.م
                  </Text>
                  <Text style={[styles.tableCell, styles.colNarrow]}>
                    {amountFormatter.format(row.disbursed)} د.م
                  </Text>
                  <Text style={[styles.tableCell, styles.colNarrow]}>
                    {amountFormatter.format(row.balance)} د.م
                  </Text>
                  <Text style={[styles.tableCell, styles.colNarrow]}>
                    {intFormatter.format(row.operations)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* السلسلة الشهرية */}
        {monthlySeries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>المساهمات والصرف عبر 12 شهراً</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colWide]}>الشهر</Text>
                <Text style={[styles.tableHeaderCell, styles.colNarrow]}>المساهمات</Text>
                <Text style={[styles.tableHeaderCell, styles.colNarrow]}>الصرف</Text>
              </View>
              {monthlySeries.map((row, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colWide]}>{row.month}</Text>
                  <Text style={[styles.tableCell, styles.colNarrow]}>
                    {amountFormatter.format(row.contributions)} د.م
                  </Text>
                  <Text style={[styles.tableCell, styles.colNarrow]}>
                    {amountFormatter.format(row.disbursed)} د.م
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
