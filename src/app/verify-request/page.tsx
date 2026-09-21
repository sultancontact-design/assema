"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, ArrowRight, Inbox } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiteLogo } from "@/components/shared/site-logo";
import { ZelligeDivider } from "@/components/shared/zellige-divider";

function VerifyRequestContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/40 py-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-6">
          <SiteLogo size="lg" />
        </div>

        <Card className="warm-shadow border-border/60">
          <CardHeader className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
              className="mx-auto grid size-20 place-items-center rounded-full bg-secondary/10"
            >
              <Inbox className="size-10 text-secondary" aria-hidden="true" />
            </motion.div>
            <CardTitle className="text-2xl font-heading text-foreground">
              تحقّق من بريدك الإلكتروني
            </CardTitle>
            <CardDescription className="text-base">
              إذا كان لدينا حساب مرتبط ببريدك، فقد أرسلنا إليك رسالة للتحقق.
            </CardDescription>
            <ZelligeDivider variant="diamond" className="mt-2 text-primary" />
          </CardHeader>

          <CardContent className="space-y-4">
            {email && (
              <div className="rounded-md border border-border bg-muted/40 p-4 text-center space-y-1">
                <p className="text-xs text-muted-foreground">تم الإرسال إلى</p>
                <p className="flex items-center justify-center gap-2 text-sm font-mono text-foreground" dir="ltr">
                  <Mail className="size-4 text-primary" />
                  <code>{email}</code>
                </p>
              </div>
            )}

            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  1
                </span>
                <span className="leading-relaxed">
                  افتح صندوق بريدك (وافحص مجلّد الرسائل غير المرغوبة / السبايم).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  2
                </span>
                <span className="leading-relaxed">
                  ابحث عن رسالة من منصة سيدي يوسف بن علي العاصمة.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  3
                </span>
                <span className="leading-relaxed">
                  انقر على الرابط داخل الرسالة لإكمال التحقق وتسجيل الدخول.
                </span>
              </li>
            </ol>

            <div className="rounded-md border border-accent/30 bg-accent/5 p-3 text-xs text-muted-foreground text-center">
              قد يستغرق وصول الرسالة بضع دقائق. إن لم تصلك خلال 10 دقائق،
              حاول تسجيل الدخول من جديد.
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button asChild size="lg" className="w-full h-11 text-base">
              <Link href="/login">
                <ArrowRight className="size-4" />
                العودة لتسجيل الدخول
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-6 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowRight className="size-4" />
            العودة للرئيسية
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyRequestPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <VerifyRequestContent />
    </React.Suspense>
  );
}
