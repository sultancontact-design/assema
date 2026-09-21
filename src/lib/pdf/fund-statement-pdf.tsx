// ===================================================================
//  fund-statement-pdf — كشف حساب الأسرة (PDF)
//  - معلومات الأسرة + ملخص الحساب
//  - جدول المعاملات (مساهمات + صرف) مع الرصيد الجاري
//  - سلسلة الرصيد الشهرية
// ===================================================================

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { ensureArabicFont, PDF_COLORS } from "./arabic-font";

ensureArabicFont();

// ===================================================================
//  الأنواع
// ===================================================================

export interface StatementTransaction {
  date: string;
  type: "مساهمة" | "صرف";
  reference: string;
  description: string;
  debit: number; // مَخصوم (صرف)
  credit: number; // مُضاف (مساهمة)
  balance: number;
}

export interface StatementMonthlyPoint {
  month: string;
  balance: number;
}

export interface FundStatementPdfData {
  organization: string;
  generatedAt: string;
  periodLabel: string;
  family: {
    familyName: string;
    headOfFamily: string;
    memberCount: number;
    economicStatus: string;
  };
  summary: {
    totalContributions: number;
    totalDisbursed: number;
    balance: number;
    transactionsCount: number;
  };
  transactions: StatementTransaction[];
  monthlySeries: StatementMonthlyPoint[];
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
  familyCard: {
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    borderRadius: 6,
    padding: 10,
    backgroundColor: PDF_COLORS.bgSoft,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  familyItem: {
    width: "48%",
  },
  familyLabel: { fontSize: 9, color: PDF_COLORS.muted, marginBottom: 2 },
  familyValue: { fontSize: 11, fontWeight: "bold", color: PDF_COLORS.text },
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
    marginBottom: 4,
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
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
  },
  tableHeaderCell: {
    fontSize: 8.5,
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
  colType: { flex: 1 },
  colRef: { flex: 1.6 },
  colDesc: { flex: 2.2 },
  colNum: { flex: 1.4 },
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

export function FundStatementPdfDocument({
  data,
}: {
  data: FundStatementPdfData;
}) {
  const amountFormatter = new Intl.NumberFormat("ar-MA", { maximumFractionDigits: 2 });
  const intFormatter = new Intl.NumberFormat("ar-MA");

  return (
    <Document title="كشف حساب الأسرة" author={data.organization}>
      <Page size="A4" style={styles.page}>
        {/* الترويسة */}
        <View style={styles.header}>
          <Text style={styles.brandName}>{data.organization}</Text>
          <Text style={styles.brandSub}>صندوق المعروف الرقمي — كشف حساب الأسرة</Text>
          <Text style={styles.docTitle}>كشف حساب الأسرة</Text>
          <Text style={styles.periodLabel}>الفترة: {data.periodLabel}</Text>
          <Text style={styles.generatedAt}>تاريخ الإصدار: {data.generatedAt}</Text>
        </View>

        {/* معلومات الأسرة */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات الأسرة</Text>
          <View style={styles.familyCard}>
            <View style={styles.familyItem}>
              <Text style={styles.familyLabel}>اسم العائلة</Text>
              <Text style={styles.familyValue}>{data.family.familyName}</Text>
            </View>
            <View style={styles.familyItem}>
              <Text style={styles.familyLabel}>رب الأسرة</Text>
              <Text style={styles.familyValue}>{data.family.headOfFamily || "—"}</Text>
            </View>
            <View style={styles.familyItem}>
              <Text style={styles.familyLabel}>عدد الأفراد</Text>
              <Text style={styles.familyValue}>
                {intFormatter.format(data.family.memberCount)} أفراد
              </Text>
            </View>
            <View style={styles.familyItem}>
              <Text style={styles.familyLabel}>الحالة الاقتصادية</Text>
              <Text style={styles.familyValue}>{data.family.economicStatus}</Text>
            </View>
          </View>
        </View>

        {/* الملخّص */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ملخّص الحساب</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>إجمالي المساهمات</Text>
              <Text style={styles.statValue}>
                {amountFormatter.format(data.summary.totalContributions)} د.م
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>إجمالي الصرف للأسرة</Text>
              <Text style={styles.statValue}>
                {amountFormatter.format(data.summary.totalDisbursed)} د.م
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>الرصيد الحالي</Text>
              <Text style={styles.statValue}>
                {amountFormatter.format(data.summary.balance)} د.م
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>عدد المعاملات</Text>
              <Text style={styles.statValue}>
                {intFormatter.format(data.summary.transactionsCount)}
              </Text>
            </View>
          </View>
        </View>

        {/* جدول المعاملات */}
        {data.transactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>تفاصيل المعاملات</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colDate]}>التاريخ</Text>
                <Text style={[styles.tableHeaderCell, styles.colType]}>النوع</Text>
                <Text style={[styles.tableHeaderCell, styles.colRef]}>المرجع</Text>
                <Text style={[styles.tableHeaderCell, styles.colDesc]}>الوصف</Text>
                <Text style={[styles.tableHeaderCell, styles.colNum]}>مَخصوم</Text>
                <Text style={[styles.tableHeaderCell, styles.colNum]}>مُضاف</Text>
                <Text style={[styles.tableHeaderCell, styles.colNum]}>الرصيد</Text>
              </View>
              {data.transactions.map((tx, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colDate]}>{tx.date}</Text>
                  <Text style={[styles.tableCell, styles.colType]}>{tx.type}</Text>
                  <Text style={[styles.tableCell, styles.colRef]}>{tx.reference}</Text>
                  <Text style={[styles.tableCell, styles.colDesc]}>{tx.description}</Text>
                  <Text style={[styles.tableCell, styles.colNum]}>
                    {tx.debit > 0 ? `${amountFormatter.format(tx.debit)} د.م` : "—"}
                  </Text>
                  <Text style={[styles.tableCell, styles.colNum]}>
                    {tx.credit > 0 ? `${amountFormatter.format(tx.credit)} د.م` : "—"}
                  </Text>
                  <Text style={[styles.tableCell, styles.colNum]}>
                    {amountFormatter.format(tx.balance)} د.م
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* السلسلة الشهرية */}
        {data.monthlySeries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>تطوّر الرصيد الشهري</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colDesc]}>الشهر</Text>
                <Text style={[styles.tableHeaderCell, styles.colNum]}>الرصيد</Text>
              </View>
              {data.monthlySeries.map((m, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colDesc]}>{m.month}</Text>
                  <Text style={[styles.tableCell, styles.colNum]}>
                    {amountFormatter.format(m.balance)} د.م
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
