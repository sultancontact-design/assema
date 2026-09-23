"use client";

// ===================================================================
//  JoinDistrictButton — زر "انضمام لهذا الحي"
//  - يستعمل API admin/districts/move-user (للأعضاء المسجّلين)
//  - للزوّار: يُحوّل لصفحة التسجيل
//  - sonner toast للنجاح/الخطأ
//  - يعكس الصلاحيات: DISTRICT_MOD+TREASURER+ETHICS+SUPER_ADMIN فقط
// ===================================================================

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserPlus, CheckCircle2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface JoinDistrictButtonProps {
  /** slug الحي المستهدَف */
  targetSlug: string;
  /** اسم الحي المستهدَف (للعرض في الـdialog) */
  targetName: string;
  /** slug الحي الحالي للمستخدم (لو نفس الحي لا نعرض الزر) */
  currentDistrictSlug?: string | null;
  /** هل المستخدم مسجّل الدخول؟ */
  isAuthenticated: boolean;
  /** اسم الحي الحالي (للعرض) */
  currentDistrictName?: string | null;
}

export function JoinDistrictButton({
  targetSlug,
  targetName,
  currentDistrictSlug,
  isAuthenticated,
  currentDistrictName,
}: JoinDistrictButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  // لو الحي هو نفسه حيّ المستخدم — لا نعرض الزر
  if (currentDistrictSlug && currentDistrictSlug === targetSlug) {
    return (
      <Button
        variant="secondary"
        className="min-h-11 w-full gap-2 sm:w-auto"
        disabled
      >
        <CheckCircle2 className="size-4" />
        أنت عضو في هذا الحي
      </Button>
    );
  }

  // زائر: وجّه للتسجيل
  if (!isAuthenticated) {
    return (
      <Button asChild className="min-h-11 w-full gap-2 sm:w-auto">
        <a href={`/login?callbackUrl=/community/districts/${targetSlug}`}>
          <LogIn className="size-4" />
          سجّل الدخول للانضمام
        </a>
      </Button>
    );
  }

  const handleJoin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/community/districts/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetDistrictSlug: targetSlug }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.error ?? json.message ?? "تعذّر الانتقال إلى هذا الحي"
        );
      }
      toast.success(`تم الانضمام إلى حي «${targetName}» بنجاح`);
      // إعادة تحميل الصفحة
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "حدث خطأ غير متوقّع أثناء الانضمام"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="min-h-11 w-full gap-2 sm:w-auto">
          <UserPlus className="size-4" />
          انضمام لهذا الحي
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>الانضمام إلى حي «{targetName}»</AlertDialogTitle>
          <AlertDialogDescription>
            {currentDistrictName
              ? `سيتم نقل عضويتك من حي «${currentDistrictName}» إلى حي «${targetName}». ستبقى مساهماتك وطلباتك السابقة محفوظة. هذا الإجراء قابل للتراجع.`
              : `سيتم تعيين حي «${targetName}» كحيّك الأساسي على المنصة.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-11">تراجع</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleJoin}
            disabled={loading}
            className="min-h-11"
          >
            {loading ? "جارٍ الانضمام..." : "نعم، انضمّ الآن"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
