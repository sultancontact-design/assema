"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BarChart3,
  Heart,
  HandHeart,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TransparencyPanel, type TransparencyData } from "./transparency-panel";
import { ContributeForm } from "./contribute-form";
import { RequestForm } from "./request-form";

// ===================================================================
//  أنواع بيانات تبويبات الصندوق
// ===================================================================

export interface FundTabsProps {
  transparency: TransparencyData;
  authed: boolean;
  treasurerName: string | null;
  treasurerPhone: string | null;
  existingContributions: {
    id: string;
    amount: number;
    month: string;
    year: number;
    method: "BANK_TRANSFER" | "CASH" | "CMI";
    receiptNumber: string | null;
    digitalReceipt: string | null;
    status: "PENDING" | "CONFIRMED" | "REJECTED" | "REFUNDED";
    createdAt: string;
  }[];
  existingRequests: {
    id: string;
    anonymousCode: string | null;
    type:
      | "MEDICAL"
      | "DEATH"
      | "WEDDING"
      | "EDUCATION"
      | "EMERGENCY"
      | "MICRO_PROJECT";
    title: string;
    amountRequested: number;
    status:
      | "SUBMITTED"
      | "UNDER_REVIEW"
      | "APPROVED"
      | "REJECTED"
      | "DISBURSED"
      | "COMPLETED";
    requiresEthics: boolean;
    createdAt: string;
    approvalsCount: number;
  }[];
}

// ===================================================================
//  مكوّن التبويبات الرئيسي
// ===================================================================

export function FundTabs({
  transparency,
  authed,
  treasurerName,
  treasurerPhone,
  existingContributions,
  existingRequests,
}: FundTabsProps) {
  return (
    <Tabs defaultValue="transparency" className="w-full">
      <TabsList className="grid w-full grid-cols-3 h-auto">
        <TabsTrigger
          value="transparency"
          className="flex flex-col items-center gap-1 py-2 sm:flex-row sm:gap-2"
        >
          <BarChart3 className="size-4" />
          <span className="text-xs sm:text-sm">الشفافية</span>
        </TabsTrigger>
        <TabsTrigger
          value="contribute"
          className="flex flex-col items-center gap-1 py-2 sm:flex-row sm:gap-2"
        >
          {authed ? (
            <Heart className="size-4" />
          ) : (
            <Lock className="size-4" />
          )}
          <span className="text-xs sm:text-sm">ساهم</span>
        </TabsTrigger>
        <TabsTrigger
          value="request"
          className="flex flex-col items-center gap-1 py-2 sm:flex-row sm:gap-2"
        >
          {authed ? (
            <HandHeart className="size-4" />
          ) : (
            <Lock className="size-4" />
          )}
          <span className="text-xs sm:text-sm">اطلب</span>
        </TabsTrigger>
      </TabsList>

      {/* التبويب 1 — الشفافية */}
      <TabsContent value="transparency" className="pt-6">
        <TransparencyPanel data={transparency} />
      </TabsContent>

      {/* التبويب 2 — ساهم */}
      <TabsContent value="contribute" className="pt-6">
        {authed ? (
          <ContributeForm
            treasurerName={treasurerName}
            treasurerPhone={treasurerPhone}
            existingContributions={existingContributions}
          />
        ) : (
          <AuthGate
            title="ساهم في صندوق المعروف"
            description="لإتمام مساهمتك، يلزم تسجيل الدخول بحساب عضو في الحي. مساهمتك تُحفظ برقم إيصال رقمي."
          />
        )}
      </TabsContent>

      {/* التبويب 3 — اطلب */}
      <TabsContent value="request" className="pt-6">
        {authed ? (
          <RequestForm existingRequests={existingRequests} />
        ) : (
          <AuthGate
            title="اطلب من صندوق المعروف"
            description="لإرسال طلبك، يلزم تسجيل الدخول بحساب عضو في الحي. طلبك يُعالَج بسرّية تامة ولن يظهر اسمك في العلن."
          />
        )}
      </TabsContent>
    </Tabs>
  );
}

// ===================================================================
//  بوابة المصادقة (Auth Gate) — بديل عند عدم الدخول
// ===================================================================

function AuthGate({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 sm:p-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Lock className="size-8" />
      </div>
      <h3 className="font-heading text-xl font-bold text-foreground">
        {title}
      </h3>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild size="lg" className="h-11">
          <Link href="/login?callbackUrl=/community/fund">سجّل الدخول</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-11">
          <Link href="/register">حساب جديد</Link>
        </Button>
      </div>
    </div>
  );
}
