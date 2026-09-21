// ===================================================================
//  fund-receipt-pdf — الإيصال الرقمي (PDF) لكل مساهمة في الصندوق
//  - رقم الإيصال (RC-2024-XXXX) بارز
//  - UUID الإيصال الرقمي للتحقّق
//  - المبلغ، المساهم، الأسرة، الطريقة، التاريخ
//  - رمز QR للتثبت
// ===================================================================

import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { ensureArabicFont, PDF_COLORS } from "./arabic-font";

ensureArabicFont();

// ===================================================================
//  الأنواع
// ===================================================================

export interface FundReceiptPdfData {
  organization: string;
  receiptNumber: string;
  digitalReceipt: string;
  amount: number;
  contributorName: string;
  familyName: string;
  methodLabel: string;
  monthLabel: string;
  year: number;
  statusLabel: string;
  createdAtLabel: string;
  qrDataUrl: string; // data:image/png;base64,...
}

// ===================================================================
//  الأنماط
// ===================================================================

const styles = StyleSheet.create({
  page: {
    direction: "rtl",
    fontFamily: "Tajawal",
    fontSize: 11,
    padding: 48,
    color: PDF_COLORS.text,
    backgroundColor: PDF_COLORS.bg,
  },
  header: {
    textAlign: "center",
    borderBottomWidth: 2,
    borderBottomColor: PDF_COLORS.accent,
    paddingBottom: 14,
    marginBottom: 24,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "bold",
    color: PDF_COLORS.text,
  },
  brandSub: {
    fontSize: 10,
    color: PDF_COLORS.muted,
    marginTop: 4,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
    marginTop: 10,
  },
  receiptNumberBox: {
    marginTop: 18,
    padding: 12,
    borderWidth: 2,
    borderColor: PDF_COLORS.accent,
    borderRadius: 8,
    backgroundColor: PDF_COLORS.bgSoft,
    textAlign: "center",
  },
  receiptNumberLabel: {
    fontSize: 10,
    color: PDF_COLORS.muted,
    marginBottom: 4,
  },
  receiptNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
  },
  digitalReceiptBox: {
    marginTop: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    borderRadius: 4,
    textAlign: "center",
  },
  digitalReceiptLabel: {
    fontSize: 9,
    color: PDF_COLORS.muted,
    marginBottom: 2,
  },
  digitalReceipt: {
    fontSize: 9,
    color: PDF_COLORS.text,
    fontFamily: "Tajawal",
  },
  amountBox: {
    marginTop: 18,
    padding: 16,
    backgroundColor: PDF_COLORS.bgSoft,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    textAlign: "center",
  },
  amountLabel: {
    fontSize: 11,
    color: PDF_COLORS.muted,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: PDF_COLORS.green,
  },
  amountCurrency: {
    fontSize: 14,
    color: PDF_COLORS.muted,
    marginTop: 4,
  },
  detailsGrid: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailCard: {
    width: "48%",
    padding: 10,
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    borderRadius: 6,
  },
  detailLabel: {
    fontSize: 9,
    color: PDF_COLORS.muted,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: PDF_COLORS.text,
  },
  statusRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "center",
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: PDF_COLORS.green,
    borderRadius: 999,
    backgroundColor: PDF_COLORS.bgSoft,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "bold",
    color: PDF_COLORS.green,
  },
  qrRow: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  qrImage: {
    width: 120,
    height: 120,
  },
  verifyBox: {
    marginTop: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    borderRadius: 6,
    backgroundColor: PDF_COLORS.bgSoft,
    textAlign: "center",
  },
  verifyText: {
    fontSize: 9,
    color: PDF_COLORS.muted,
  },
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

export function FundReceiptPdfDocument({
  data,
}: {
  data: FundReceiptPdfData;
}) {
  const amountFormatter = new Intl.NumberFormat("ar-MA", { maximumFractionDigits: 2 });

  return (
    <Document title={`إيصال رقمي ${data.receiptNumber}`} author={data.organization}>
      <Page size="A4" style={styles.page}>
        {/* الترويسة */}
        <View style={styles.header}>
          <Text style={styles.brandName}>{data.organization}</Text>
          <Text style={styles.brandSub}>صندوق المعروف الرقمي — إيصال رسمي</Text>
          <Text style={styles.docTitle}>الإيصال الرقمي</Text>
        </View>

        {/* رقم الإيصال */}
        <View style={styles.receiptNumberBox}>
          <Text style={styles.receiptNumberLabel}>رقم الإيصال</Text>
          <Text style={styles.receiptNumber}>{data.receiptNumber}</Text>
        </View>

        {/* UUID الإيصال الرقمي */}
        <View style={styles.digitalReceiptBox}>
          <Text style={styles.digitalReceiptLabel}>
            المعرّف الرقمي للتحقّق (UUID)
          </Text>
          <Text style={styles.digitalReceipt}>{data.digitalReceipt}</Text>
        </View>

        {/* المبلغ */}
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>المبلغ المساهَم به</Text>
          <Text style={styles.amountValue}>
            {amountFormatter.format(data.amount)}
          </Text>
          <Text style={styles.amountCurrency}>درهم مغربي</Text>
        </View>

        {/* التفاصيل */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>المساهم</Text>
            <Text style={styles.detailValue}>{data.contributorName}</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>الأسرة</Text>
            <Text style={styles.detailValue}>{data.familyName}</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>طريقة الدفع</Text>
            <Text style={styles.detailValue}>{data.methodLabel}</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>شهر المساهمة</Text>
            <Text style={styles.detailValue}>
              {data.monthLabel} {data.year}
            </Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>تاريخ المساهمة</Text>
            <Text style={styles.detailValue}>{data.createdAtLabel}</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>الحالة</Text>
            <Text style={styles.detailValue}>{data.statusLabel}</Text>
          </View>
        </View>

        {/* الحالة */}
        <View style={styles.statusRow}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{data.statusLabel}</Text>
          </View>
        </View>

        {/* رمز QR */}
        {data.qrDataUrl && (
          <View style={styles.qrRow}>
            {/* @react-pdf/renderer Image doesn't support alt-text, suppress a11y rule */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image style={styles.qrImage} src={data.qrDataUrl} />
          </View>
        )}

        {/* التثبت */}
        <View style={styles.verifyBox}>
          <Text style={styles.verifyText}>
            للتحقّق من صحة هذا الإيصال، ادخل المعرّف الرقمي (UUID) على منصة الصندوق
          </Text>
        </View>

        {/* التذييل */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            هذا المستند مُولّد آلياً — صندوق المعروف الرقمي · {data.organization}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
