// ===================================================================
//  صفحة الإيصال الرقمي — /community/fund/receipt/[id]
//  Server Component يعرض إيصال المساهمة الكامل
//  يولّد رمز QR محلياً عبر QRCode.toDataURL ويُمرّره للعميل للعرض
// ===================================================================

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Download, Share2, ShieldCheck, Hash } from "lucide-react";
import QRCode from "qrcode";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import {
  FundReceiptClient,
  type ReceiptClientProps,
} from "@/components/community/fund-receipt-client";
import {
  CONTRIBUTION_METHOD_LABELS,
  CONTRIBUTION_STATUS_LABELS,
  formatMAD,
  formatDateTimeArabic,
} from "@/lib/constants";
import type { ContributionMethod, ContributionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/community/fund");
  }

  const { id } = await params;
  const contribution = await db.contribution.findUnique({
    where: { id },
    include: {
      user: { select: { fullName: true } },
      family: { select: { familyName: true } },
    },
  });

  if (!contribution) {
    notFound();
  }

  // التحقّق من الصلاحية
  const isOwner = contribution.userId === user.id;
  const isStaff = user.role === "TREASURER" || user.role === "SUPER_ADMIN";
  if (!isOwner && !isStaff) {
    redirect("/community/fund?error=forbidden");
  }

  if (!contribution.receiptNumber || !contribution.digitalReceipt) {
    redirect("/community/fund?error=no_receipt");
  }

  // توليد رمز QR من digitalReceipt UUID
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(contribution.digitalReceipt, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#1F1A17", light: "#FFFFFF" },
    });
  } catch {
    // تجاهل
  }

  const monthDate = new Date(
    contribution.year,
    parseInt(contribution.month.slice(5, 7), 10) - 1,
    1
  );
  const monthLabel = new Intl.DateTimeFormat("ar-MA", { month: "long" }).format(monthDate);

  const status = contribution.status as ContributionStatus;
  const method = contribution.method as ContributionMethod;

  const district = await db.district.findFirst({
    where: { id: contribution.districtId },
    select: { name: true },
  });
  const organization = district?.name ?? "سيدي يوسف بن علي";

  const props: ReceiptClientProps = {
    id: contribution.id,
    organization,
    receiptNumber: contribution.receiptNumber,
    digitalReceipt: contribution.digitalReceipt,
    amount: contribution.amount,
    contributorName: contribution.user?.fullName ?? "—",
    familyName: contribution.family?.familyName ?? "—",
    methodLabel: CONTRIBUTION_METHOD_LABELS[method] ?? contribution.method,
    monthLabel,
    year: contribution.year,
    statusLabel: CONTRIBUTION_STATUS_LABELS[status] ?? contribution.status,
    statusColor:
      status === "CONFIRMED"
        ? "emerald"
        : status === "PENDING"
        ? "amber"
        : status === "REJECTED"
        ? "rose"
        : "slate",
    createdAtLabel: formatDateTimeArabic(contribution.createdAt),
    qrDataUrl,
    bankReference: contribution.bankReference ?? null,
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
      {/* رأس الصفحة */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/community/fund"
            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="size-4" />
            <span>صندوق المعروف</span>
          </Link>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="size-7 text-primary" />
              الإيصال الرقمي
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              إيصال رسمي لمساهمتك في صندوق المعروف. يمكن استخدام الرمز الرقمي
              (UUID) للتحقّق من صحته.
            </p>
          </div>
        </div>
      </section>

      <ZelligeDivider variant="diamond" />

      {/* بطاقة الإيصال */}
      <Card className="warm-shadow overflow-hidden">
        {/* الترويسة — قوس مغربي */}
        <div className="moroccan-arch maarouf-gradient p-6 text-center text-primary-foreground">
          <p className="text-base font-semibold">{organization}</p>
          <p className="text-sm opacity-90 mt-1">
            صندوق المعروف الرقمي — إيصال رسمي
          </p>
          <h2 className="font-heading text-2xl font-bold mt-3">الإيصال الرقمي</h2>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* رقم الإيصال */}
          <div className="text-center rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
            <p className="text-xs text-muted-foreground mb-1">رقم الإيصال</p>
            <p className="text-3xl font-bold text-primary font-mono">
              {contribution.receiptNumber}
            </p>
          </div>

          {/* UUID */}
          <div className="text-center rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1.5">
              <Hash className="size-3" />
              المعرّف الرقمي للتحقّق
            </p>
            <p className="text-xs font-mono break-all px-2">
              {contribution.digitalReceipt}
            </p>
          </div>

          {/* المبلغ */}
          <div className="text-center rounded-xl bg-emerald-50 border border-emerald-200 p-6">
            <p className="text-xs text-muted-foreground mb-2">المبلغ المساهَم به</p>
            <p className="text-5xl font-bold text-emerald-700">
              {formatMAD(contribution.amount)}
            </p>
          </div>

          {/* التفاصيل */}
          <div className="grid grid-cols-2 gap-3">
            <DetailCard label="المساهم" value={props.contributorName} />
            <DetailCard label="الأسرة" value={props.familyName} />
            <DetailCard label="طريقة الدفع" value={props.methodLabel} />
            <DetailCard
              label="شهر المساهمة"
              value={`${props.monthLabel} ${props.year}`}
            />
            <DetailCard
              label="تاريخ المساهمة"
              value={props.createdAtLabel}
            />
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground mb-1">الحالة</p>
              <Badge
                className={
                  status === "CONFIRMED"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : status === "PENDING"
                    ? "bg-amber-100 text-amber-800 border-amber-200"
                    : status === "REJECTED"
                    ? "bg-rose-100 text-rose-800 border-rose-200"
                    : "bg-slate-100 text-slate-800 border-slate-200"
                }
              >
                {props.statusLabel}
              </Badge>
            </div>
          </div>

          {/* مرجع التحويل البنكي إن وُجد */}
          {contribution.bankReference && (
            <div className="text-center text-xs text-muted-foreground">
              مرجع التحويل البنكي:{" "}
              <span className="font-mono">{contribution.bankReference}</span>
            </div>
          )}

          {/* رمز QR */}
          {qrDataUrl && (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-lg border border-border bg-white p-3">
                <img
                  src={qrDataUrl}
                  alt="رمز التحقّق QR"
                  width={160}
                  height={160}
                  className="size-40"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                امسح الرمز للتحقّق من الإيصال
              </p>
            </div>
          )}

          <ZelligeDivider variant="minimal" />

          {/* تنبيه */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
            <p className="text-xs text-amber-800">
              🔒 احتفظ بهذا الإيصال كوثيقة رسمية. لا تُشارك المعرّف الرقمي (UUID)
              إلا مع أمين الصندوق للتحقّق.
            </p>
          </div>

          {/* الأزرار */}
          <FundReceiptClient {...props} />
        </CardContent>
      </Card>
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}
