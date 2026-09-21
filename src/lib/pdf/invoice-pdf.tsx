// ===================================================================
//  invoice-pdf — مكوّن فاتورة إعلانية قابل للعرض كـPDF
//  يستخدم @react-pdf/renderer — خط Helvetica (دعم Unicode محدود)
//  المحتوى عربي كامل + اتجاه RTL عبر style
// ===================================================================

import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Ad, AdPackage } from "@prisma/client";
import { AD_PACKAGE_LABELS, AD_PLACEMENT_LABELS } from "@/lib/constants";
import { generateInvoiceNumber } from "@/lib/ads-utils";

// ===================================================================
//  تسجيل خط Tajawal من ملفات @fontsource المحلية (دعم العربية)
//  نقرأ الملفات من node_modules على القرص (لا تتطلّب أي معالِج حِزم)
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

export interface InvoicePdfData {
  ad: Pick<
    Ad,
    | "id"
    | "title"
    | "advertiserName"
    | "advertiserEmail"
    | "advertiserPhone"
    | "package"
    | "placement"
    | "amountPaid"
    | "startDate"
    | "endDate"
    | "createdAt"
  >;
  invoiceNumber?: string;
  organization: string;
  contact?: {
    address?: string;
    phone?: string;
    email?: string;
    ice?: string;
  };
}

// ===================================================================
//  الأنماط — RTL على مستوى المستند
// ===================================================================

const styles = StyleSheet.create({
  page: {
    direction: "rtl",
    fontFamily: "Tajawal",
    fontSize: 11,
    padding: 40,
    color: "#1F1A17",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: "#C8842A",
    paddingBottom: 16,
    marginBottom: 24,
  },
  brand: { flex: 1 },
  brandName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F1A17",
    marginBottom: 4,
  },
  brandTagline: { fontSize: 10, color: "#6B5D4E" },
  invoiceTitleBox: { alignItems: "flex-start" },
  invoiceTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#C8842A",
  },
  invoiceNumber: {
    fontSize: 11,
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
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  metaLabel: { color: "#6B5D4E", fontSize: 10 },
  metaValue: { color: "#1F1A17", fontSize: 11, fontWeight: "bold" },
  table: {
    borderWidth: 1,
    borderColor: "#E5DDD0",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#FBF6EE",
    borderBottomWidth: 1,
    borderBottomColor: "#E5DDD0",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#6B5D4E",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1EBDD",
  },
  tableCell: { fontSize: 10, color: "#1F1A17" },
  colWide: { flex: 3 },
  colMid: { flex: 2 },
  colNarrow: { flex: 1.2 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: "#C8842A",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F1A17",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#C8842A",
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 40,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5DDD0",
    textAlign: "center",
  },
  footerText: {
    fontSize: 9,
    color: "#6B5D4E",
    marginBottom: 2,
  },
  footerThank: {
    fontSize: 10,
    color: "#C8842A",
    fontWeight: "bold",
    marginTop: 4,
  },
});

// ===================================================================
//  المُكوّن
// ===================================================================

export function InvoicePdfDocument({ data }: { data: InvoicePdfData }) {
  const { ad, organization, contact } = data;
  const invoiceNumber = data.invoiceNumber ?? generateInvoiceNumber(ad);
  const packageLabel = AD_PACKAGE_LABELS[ad.package as AdPackage].label;
  const placementLabel = AD_PLACEMENT_LABELS[ad.placement] ?? ad.placement;

  const dateFormatter = new Intl.DateTimeFormat("ar-MA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const amountFormatter = new Intl.NumberFormat("ar-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const amountText = `${amountFormatter.format(ad.amountPaid)} د.م`;
  const isPaid = ad.amountPaid > 0;

  return (
    <Document title={`فاتورة ${invoiceNumber}`} author={organization}>
      <Page size="A4" style={styles.page}>
        {/* الترويسة */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <Text style={styles.brandName}>{organization}</Text>
            <Text style={styles.brandTagline}>منصة المعروف الرقمي</Text>
            {contact?.address && (
              <Text style={styles.brandTagline}>{contact.address}</Text>
            )}
            {contact?.phone && (
              <Text style={styles.brandTagline}>الهاتف: {contact.phone}</Text>
            )}
            {contact?.email && (
              <Text style={styles.brandTagline}>البريد: {contact.email}</Text>
            )}
            {contact?.ice && (
              <Text style={styles.brandTagline}>ICE: {contact.ice}</Text>
            )}
          </View>
          <View style={styles.invoiceTitleBox}>
            <Text style={styles.invoiceTitle}>فاتورة إعلانية</Text>
            <Text style={styles.invoiceNumber}>رقم: {invoiceNumber}</Text>
            <Text style={styles.invoiceNumber}>
              التاريخ: {dateFormatter.format(new Date(ad.createdAt))}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: isPaid ? "#2D5A3D" : "#C8842A" }]}>
              <Text style={styles.statusBadgeText}>
                {isPaid ? "مدفوعة" : "قيد السداد"}
              </Text>
            </View>
          </View>
        </View>

        {/* بيانات المعلن */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>بيانات المعلن</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>الاسم / الجهة:</Text>
            <Text style={styles.metaValue}>{ad.advertiserName}</Text>
          </View>
          {ad.advertiserEmail && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>البريد الإلكتروني:</Text>
              <Text style={styles.metaValue}>{ad.advertiserEmail}</Text>
            </View>
          )}
          {ad.advertiserPhone && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>الهاتف:</Text>
              <Text style={styles.metaValue}>{ad.advertiserPhone}</Text>
            </View>
          )}
        </View>

        {/* تفاصيل الحملة */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>تفاصيل الحملة الإعلانية</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colWide]}>الحملة</Text>
              <Text style={[styles.tableHeaderCell, styles.colNarrow]}>الباقة</Text>
              <Text style={[styles.tableHeaderCell, styles.colMid]}>المكان</Text>
              <Text style={[styles.tableHeaderCell, styles.colNarrow]}>من</Text>
              <Text style={[styles.tableHeaderCell, styles.colNarrow]}>إلى</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colWide]}>{ad.title}</Text>
              <Text style={[styles.tableCell, styles.colNarrow]}>{packageLabel}</Text>
              <Text style={[styles.tableCell, styles.colMid]}>{placementLabel}</Text>
              <Text style={[styles.tableCell, styles.colNarrow]}>
                {dateFormatter.format(new Date(ad.startDate))}
              </Text>
              <Text style={[styles.tableCell, styles.colNarrow]}>
                {dateFormatter.format(new Date(ad.endDate))}
              </Text>
            </View>
          </View>
        </View>

        {/* الإجمالي */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>المبلغ الإجمالي (شامل الرسوم)</Text>
          <Text style={styles.totalValue}>{amountText}</Text>
        </View>

        {/* التذييل */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            صدرت هذه الفاتورة إلكترونياً من منصة {organization} — لا تحتاج لتوقيع يدوي.
          </Text>
          <Text style={styles.footerText}>
            في حال أي استفسار يُرجى التواصل عبر القنوات الرسمية للمنصة.
          </Text>
          <Text style={styles.footerThank}>شكراً لثقتكم ودعمكم لخدمات الحي.</Text>
        </View>
      </Page>
    </Document>
  );
}
