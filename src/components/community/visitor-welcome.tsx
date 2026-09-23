"use client";
import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, X } from "lucide-react";

export function VisitorWelcome() {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    const dismissed = localStorage.getItem("visitor_welcome_dismissed");
    if (!dismissed) setShow(true);
  }, []);
  if (!show) return null;
  return (
    <Card className="border-primary/30 bg-primary/5 mb-4">
      <CardContent className="p-4 relative">
        <button onClick={() => { localStorage.setItem("visitor_welcome_dismissed", "1"); setShow(false); }} className="absolute top-2 end-2 text-muted-foreground hover:text-foreground" aria-label="إغلاق"><X className="size-4" /></button>
        <div className="flex items-start gap-3">
          <span className="grid place-items-center size-10 rounded-lg bg-primary/10 text-primary shrink-0"><Sparkles className="size-5" /></span>
          <div className="flex-1">
            <p className="font-heading font-bold text-foreground">مرحباً بك في منصة المعروف الرقمي!</p>
            <p className="text-sm text-muted-foreground mt-1">سجّل دخولك أو أنشئ حساباً للانضمام إلى مجتمع حيّك. ساهم، اطلب، شارك، وانتمِ.</p>
            <div className="flex gap-2 mt-3">
              <Button asChild size="sm" className="h-9"><Link href="/login">تسجيل الدخول</Link></Button>
              <Button asChild size="sm" variant="outline" className="h-9"><Link href="/register">حساب جديد</Link></Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
