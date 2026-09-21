// ===================================================================
//  fund-periodic-report-pdf — التقرير الدوري للصندوق (PDF)
//  - ملخّص المساهمات والصرف والرصيد
//  - جدول العمليات (مساهمات + طلبات)
//  - السلسلة الشهرية
// ===================================================================

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { ensureArabicFont, PDF_COLORS } from "./arabic-font";

ensureArabicFont();

// ===================================================================
//  الأنواع
// ===================================================================

export interface PeriodicTransaction {
  date: string;
  type: string; // "مساهمة" | "صرف" | "موافقة"...
  reference: string;
  amount: number;
  status: string;
  by: string;
}

export interface PeriodicMonthlyPoint {
  month: string;
  contributions: number;
  disbursed: number;
}

export interface FundPeriodicReportPdfData {
  organization: string;
  generatedAt: string;
  periodLabel: string;
  periodKind: "daily" | "weekly" | "monthly" | "yearly";
  periodKindLabel: string;
  summary: {
    contributionsCount: number;
    contributionsAmount: number;
    requestsCount: number;
    disbursedAmount: number;
    balance: number;
  };
  transactions: PeriodicTransaction[];
  monthlySeries: PeriodicMonthlyPoint[];
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
    fontSize: 16,
    fontWeight: "bold",
    color: PDF_COLORS.text,
    marginBottom: 2,
  },
  brandSub: {
    fontSize: 9,
    color: PDF_COLORS.muted,
  },
  docTitle: {
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
  periodKindLabel: {
    fontSize: 10,
    color: PDF_COLORS.muted,
    marginTop: 2,
  },
  generatedAt: {
    fontSize: 9,
    color: PDF_COLORS.muted,
    marginTop: 2,
  },
  section: { marginBottom: 18 },
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
    width: "32%",
    padding: 10,
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    borderRadius: 6,
    marginBottom: 4,
  },
  statLabel: { fontSize: 9, color: PDF_COLORS.muted, marginBottom: 4 },
  statValue: { fontSize: 13, fontWeight: "bold", color: PDF_COLORS.text },
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
    paddingHorizontal: 6,
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
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.borderSoft,
  },
  tableCell: { fontSize: 8.5, color: PDF_COLORS.text },
  colDate: { flex: 1.6 },
  colType: { flex: 1.4 },
  colRef: { flex: 1.8 },
  colBy: { flex: 2 },
  colStatus: { flex: 1.4 },
  colAmount: { flex: 1.4 },
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
//  المكوّن
// ===================================================================

export function FundPeriodicReportPdfDocument({
  data,
}: {
  data: FundPeriodicReportPdfData;
}) {
  const amountFormatter = new Intl.NumberFormat("ar-MA", { maximumFractionDigits: 2 });
  const intFormatter = new Intl.NumberFormat("ar-MA");

  return (
    <Document title={`${data.periodKindLabel} — صندوق المعروف`} author={data.organization}>
      <Page size="A4" style={styles.page}>
        {/* الترويسة */}
        <View style={styles.header}>
          <Text style={styles.brandName}>{data.organization}</Text>
          <Text style={styles.brandSub}>صندوق المعروف الرقمي — تقرير دوري</Text>
          <Text style={styles.docTitle}>{data.periodKindLabel}</Text>
          <Text style={styles.periodLabel}>الفترة: {data.periodLabel}</Text>
          <Text style={styles.generatedAt}>تاريخ الإصدار: {data.generatedAt}</Text>
        </View>

        {/* الملخّص */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ملخّص الفترة</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>عدد المساهمات</Text>
              <Text style={styles.statValue}>
                {intFormatter.format(data.summary.contributionsCount)}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>إجمالي المساهمات</Text>
              <Text style={styles.statValue}>
                {amountFormatter.format(data.summary.contributionsAmount)} د.م
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>عدد الطلبات</Text>
              <Text style={styles.statValue}>
                {intFormatter.format(data.summary.requestsCount)}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>إجمالي الصرف</Text>
              <Text style={styles.statValue}>
                {amountFormatter.format(data.summary.disbursedAmount)} د.م
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>رصيد الفترة</Text>
              <Text style={styles.statValue}>
                {amountFormatter.format(data.summary.balance)} د.م
              </Text>
            </View>
          </View>
        </View>

        {/* جدول العمليات */}
        {data.transactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>تفاصيل العمليات</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colDate]}>التاريخ</Text>
                <Text style={[styles.tableHeaderCell, styles.colType]}>النوع</Text>
                <Text style={[styles.tableHeaderCell, styles.colRef]}>المرجع</Text>
                <Text style={[styles.tableHeaderCell, styles.colBy]}>المُقدِّم/المُصادِق</Text>
                <Text style={[styles.tableHeaderCell, styles.colStatus]}>الحالة</Text>
                <Text style={[styles.tableHeaderCell, styles.colAmount]}>المبلغ</Text>
              </View>
              {data.transactions.map((tx, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colDate]}>{tx.date}</Text>
                  <Text style={[styles.tableCell, styles.colType]}>{tx.type}</Text>
                  <Text style={[styles.tableCell, styles.colRef]}>{tx.reference}</Text>
                  <Text style={[styles.tableCell, styles.colBy]}>{tx.by}</Text>
                  <Text style={[styles.tableCell, styles.colStatus]}>{tx.status}</Text>
                  <Text style={[styles.tableCell, styles.colAmount]}>
                    {amountFormatter.format(tx.amount)} د.م
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* السلسلة الشهرية */}
        {data.monthlySeries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>المساهمات مقابل الصرف عبر الأشهر</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colDate]}>الشهر</Text>
                <Text style={[styles.tableHeaderCell, styles.colAmount]}>المساهمات</Text>
                <Text style={[styles.tableHeaderCell, styles.colAmount]}>الصرف</Text>
              </View>
              {data.monthlySeries.map((m, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colDate]}>{m.month}</Text>
                  <Text style={[styles.tableCell, styles.colAmount]}>
                    {amountFormatter.format(m.contributions)} د.م
                  </Text>
                  <Text style={[styles.tableCell, styles.colAmount]}>
                    {amountFormatter.format(m.disbursed)} د.م
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* التذييل */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            هذا المستند مُولّد آلياً — صندوق المعروف الرقمي · {data.generatedAt}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
