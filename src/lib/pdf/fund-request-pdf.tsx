// ===================================================================
//  fund-request-pdf — تتبّع طلب معروف (PDF)
//  - معلومات الطلب (الرمز المجهول، النوع، المبلغ، الموقع)
//  - مخطّط الموافقات (5 أعضاء اللجنة)
//  - الخط الزمني للتدقيق (Audit trail)
// ===================================================================

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { ensureArabicFont, PDF_COLORS } from "./arabic-font";

ensureArabicFont();

// ===================================================================
//  الأنواع
// ===================================================================

export interface RequestApprovalRow {
  approverName: string;
  decision: "APPROVE" | "REJECT" | "ABSTAIN" | "PENDING";
  decisionLabel: string;
  note: string | null;
  decidedAtLabel: string | null;
}

export interface RequestAuditEntry {
  step: string;
  label: string;
  dateLabel: string;
  byName: string | null;
  note: string | null;
}

export interface FundRequestPdfData {
  organization: string;
  generatedAt: string;
  anonymousCode: string;
  typeLabel: string;
  typeEmoji: string;
  title: string;
  description: string;
  amountRequested: number;
  amountApproved: number | null;
  amountDisbursed: number | null;
  location: string | null;
  statusLabel: string;
  requiresEthics: boolean;
  approvals: RequestApprovalRow[];
  auditTrail: RequestAuditEntry[];
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
  generatedAt: {
    fontSize: 9,
    color: PDF_COLORS.muted,
    marginTop: 4,
  },
  anonymousBox: {
    marginTop: 14,
    padding: 10,
    borderWidth: 2,
    borderColor: PDF_COLORS.accent,
    borderRadius: 8,
    backgroundColor: PDF_COLORS.bgSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  anonymousCode: {
    fontSize: 22,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
  },
  anonymousLabel: {
    fontSize: 9,
    color: PDF_COLORS.muted,
    marginBottom: 2,
  },
  anonymousRight: { flex: 1 },
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
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  infoCard: {
    width: "48%",
    padding: 10,
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    borderRadius: 6,
    marginBottom: 4,
  },
  infoLabel: { fontSize: 9, color: PDF_COLORS.muted, marginBottom: 3 },
  infoValue: { fontSize: 11, fontWeight: "bold", color: PDF_COLORS.text },
  descBlock: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    borderRadius: 6,
    backgroundColor: PDF_COLORS.bgSoft,
  },
  descText: { fontSize: 10, color: PDF_COLORS.text, lineHeight: 1.6 },
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
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.borderSoft,
  },
  tableCell: { fontSize: 9, color: PDF_COLORS.text },
  colName: { flex: 2.5 },
  colDec: { flex: 1.4 },
  colDate: { flex: 1.6 },
  colNote: { flex: 2.5 },
  timelineRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.borderSoft,
  },
  colStep: { flex: 1 },
  colLabel: { flex: 2 },
  colDate2: { flex: 1.8 },
  colBy: { flex: 1.8 },
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

export function FundRequestPdfDocument({
  data,
}: {
  data: FundRequestPdfData;
}) {
  const amountFormatter = new Intl.NumberFormat("ar-MA", { maximumFractionDigits: 2 });

  return (
    <Document title={`تتبّع طلب ${data.anonymousCode}`} author={data.organization}>
      <Page size="A4" style={styles.page}>
        {/* الترويسة */}
        <View style={styles.header}>
          <Text style={styles.brandName}>{data.organization}</Text>
          <Text style={styles.brandSub}>صندوق المعروف الرقمي — تتبّع الطلب</Text>
          <Text style={styles.docTitle}>تتبّع طلب المعروف</Text>
          <Text style={styles.generatedAt}>تاريخ الإصدار: {data.generatedAt}</Text>
        </View>

        {/* الرمز المجهول */}
        <View style={styles.anonymousBox}>
          <View style={styles.anonymousRight}>
            <Text style={styles.anonymousLabel}>الرمز الرمزي للطلب (بدل الاسم)</Text>
            <Text style={styles.anonymousCode}>{data.anonymousCode}</Text>
          </View>
          <Text style={[styles.infoValue, { fontSize: 28 }]}>{data.typeEmoji}</Text>
        </View>

        {/* معلومات الطلب */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات الطلب</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>النوع</Text>
              <Text style={styles.infoValue}>
                {data.typeEmoji} {data.typeLabel}
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>الحالة</Text>
              <Text style={styles.infoValue}>{data.statusLabel}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>المبلغ المطلوب</Text>
              <Text style={styles.infoValue}>
                {amountFormatter.format(data.amountRequested)} د.م
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>المبلغ المعتمد</Text>
              <Text style={styles.infoValue}>
                {data.amountApproved !== null
                  ? `${amountFormatter.format(data.amountApproved)} د.م`
                  : "—"}
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>المبلغ المصروف</Text>
              <Text style={styles.infoValue}>
                {data.amountDisbursed !== null
                  ? `${amountFormatter.format(data.amountDisbursed)} د.م`
                  : "—"}
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>الموقع</Text>
              <Text style={styles.infoValue}>{data.location || "—"}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>العنوان</Text>
              <Text style={styles.infoValue}>{data.title}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>يتطلّب لجنة النزاهة</Text>
              <Text style={styles.infoValue}>
                {data.requiresEthics ? "نعم (≥ 1000 د.م)" : "لا"}
              </Text>
            </View>
          </View>
          <View style={styles.descBlock}>
            <Text style={styles.descText}>{data.description}</Text>
          </View>
        </View>

        {/* الموافقات */}
        {data.requiresEthics && data.approvals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              موافقات لجنة النزاهة (3 من 5 مطلوبة)
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colName]}>العضو</Text>
                <Text style={[styles.tableHeaderCell, styles.colDec]}>القرار</Text>
                <Text style={[styles.tableHeaderCell, styles.colDate]}>التاريخ</Text>
                <Text style={[styles.tableHeaderCell, styles.colNote]}>ملاحظة</Text>
              </View>
              {data.approvals.map((a, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colName]}>{a.approverName}</Text>
                  <Text style={[styles.tableCell, styles.colDec]}>{a.decisionLabel}</Text>
                  <Text style={[styles.tableCell, styles.colDate]}>
                    {a.decidedAtLabel ?? "—"}
                  </Text>
                  <Text style={[styles.tableCell, styles.colNote]}>
                    {a.note ?? "—"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* الخط الزمني للتدقيق */}
        {data.auditTrail.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الخط الزمني للتدقيق</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colStep]}>#</Text>
                <Text style={[styles.tableHeaderCell, styles.colLabel]}>المرحلة</Text>
                <Text style={[styles.tableHeaderCell, styles.colDate2]}>التاريخ</Text>
                <Text style={[styles.tableHeaderCell, styles.colBy]}>بواسطة</Text>
              </View>
              {data.auditTrail.map((a, i) => (
                <View key={i} style={styles.timelineRow}>
                  <Text style={[styles.tableCell, styles.colStep]}>{a.step}</Text>
                  <Text style={[styles.tableCell, styles.colLabel]}>{a.label}</Text>
                  <Text style={[styles.tableCell, styles.colDate2]}>{a.dateLabel}</Text>
                  <Text style={[styles.tableCell, styles.colBy]}>{a.byName ?? "—"}</Text>
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
