"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { FundRequestStatus } from "@prisma/client";

export interface RequestClientProps {
  id: string;
  organization: string;
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
  statusStep: number;
  status: FundRequestStatus;
  requiresEthics: boolean;
  attachments: string[];
  approvals: {
    approverName: string;
    decision: "APPROVE" | "REJECT" | "ABSTAIN" | "PENDING";
    decisionLabel: string;
    note: string | null;
    decidedAtLabel: string | null;
  }[];
  auditTrail: {
    step: string;
    label: string;
    dateLabel: string;
    byName: string | null;
    note: string | null;
  }[];
}

export function FundRequestClient(props: RequestClientProps) {
  const [downloading, setDownloading] = React.useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/fund/requests/${props.id}/pdf`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "فشل التنزيل");
      }
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `طلب-${props.anonymousCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success("تم تنزيل تقرير الطلب PDF بنجاح");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "حدث خطأ أثناء تنزيل الملف"
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-3 text-center">
      <p className="text-sm font-bold text-foreground">حمّل تقرير الطلب الكامل</p>
      <p className="text-xs text-muted-foreground">
        تقرير PDF شامل يتضمّن كل الموافقات والخط الزمني للتدقيق
      </p>
      <Button
        onClick={handleDownload}
        disabled={downloading}
        size="lg"
        className="h-12 w-full"
      >
        <Download className="size-4" />
        {downloading ? "جاري التحضير..." : "تنزيل PDF"}
      </Button>
    </div>
  );
}
