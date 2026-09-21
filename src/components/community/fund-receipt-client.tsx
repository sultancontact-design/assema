"use client";

import * as React from "react";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface ReceiptClientProps {
  id: string;
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
  statusColor: string;
  createdAtLabel: string;
  qrDataUrl: string;
  bankReference: string | null;
}

export function FundReceiptClient(props: ReceiptClientProps) {
  const [downloading, setDownloading] = React.useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/fund/receipt/${props.id}/pdf`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "فشل التنزيل");
      }
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `إيصال-${props.receiptNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success("تم تنزيل الإيصال PDF بنجاح");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "حدث خطأ أثناء تنزيل الملف"
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `إيصال صندوق المعروف ${props.receiptNumber}`,
          text: `إيصال رسمي بقيمة ${props.amount} د.م — ${props.organization}`,
          url,
        });
        toast.success("تمت المشاركة");
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("تم نسخ الرابط");
      }
    } catch {
      // تجاهل
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Button
        onClick={handleDownload}
        disabled={downloading}
        size="lg"
        className="h-12"
      >
        <Download className="size-4" />
        {downloading ? "جاري التحضير..." : "تنزيل PDF"}
      </Button>
      <Button
        onClick={handleShare}
        variant="outline"
        size="lg"
        className="h-12"
      >
        <Share2 className="size-4" />
        مشاركة
      </Button>
    </div>
  );
}
