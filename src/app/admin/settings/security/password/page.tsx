import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { ChangePasswordClient } from "@/components/admin/change-password-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, ShieldCheck, History, Smartphone } from "lucide-react";
import { formatDateArabic } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "الأمان — كلمة المرور",
};

export default async function PasswordChangePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/settings/security/password");

  const loginLogs = await db.auditLog.findMany({
    where: {
      OR: [
        { action: { contains: "login" } },
        { action: { contains: "logout" } },
        { action: { contains: "2fa" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, action: true, severity: true, ip: true, userAgent: true, createdAt: true },
  });

  return (
    <div className="flex flex-col">
      <PageHero
        title="الأمان — كلمة المرور"
        subtitle="غيّر كلمة مرورك بانتظام. استخدم 12+ حرفاً مع حرف كبير ورقم ورمز."
        image="https://images.unsplash.com/photo-1563014439-9c4ed2f7e3a4?auto=format&fit=crop&w=1920&q=80"
        imageAlt="الأمان — كلمة المرور"
        badge="إعدادات أمنية"
      />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8"><ChangePasswordClient /></div>
          <div className="lg:col-span-4 space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="size-4 text-secondary" />حالة الأمان</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">كلمة المرور</span><Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">مُعيَّنة</Badge></div>
                <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">2FA</span><Badge variant="outline" className={user.twoFactorEnabled ? "bg-secondary/10 text-secondary border-secondary/30" : "bg-amber-100 text-amber-700"}>{user.twoFactorEnabled ? "مُفعّل" : "غير مُفعّل"}</Badge></div>
                <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">آخر دخول</span><span className="text-xs text-muted-foreground">{user.lastLoginAt ? formatDateArabic(user.lastLoginAt) : "—"}</span></div>
              </CardContent>
            </Card>
            {!user.twoFactorEnabled && (
              <Card className="border-amber-200 bg-amber-50/60 dark:bg-amber-950/10">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <Lock className="size-5 text-amber-600 mt-0.5" />
                    <div><p className="font-bold text-sm text-foreground">فعّل المصادقة الثنائية</p><p className="text-xs text-muted-foreground mt-1">اذهب لـ /admin/settings/security</p></div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        <div>
          <div className="mb-3 flex items-center gap-2"><History className="size-5 text-primary" /><h2 className="font-heading text-lg font-bold text-foreground">سجل الدخول (آخر 20)</h2></div>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 border-b border-border">
                    <tr><th className="text-start p-3 font-medium text-muted-foreground">الإجراء</th><th className="text-start p-3 font-medium text-muted-foreground">الجهاز</th><th className="text-start p-3 font-medium text-muted-foreground">IP</th><th className="text-start p-3 font-medium text-muted-foreground">الحالة</th><th className="text-start p-3 font-medium text-muted-foreground">التاريخ</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loginLogs.length === 0 ? (<tr><td colSpan={5} className="p-8 text-center text-muted-foreground">لا توجد سجلّات دخول بعد</td></tr>) : (
                      loginLogs.map((log) => {
                        const isSuccess = log.severity === "info";
                        const isFail = log.severity === "warning" || log.severity === "error";
                        const ua = log.userAgent ?? "";
                        const isMobile = /Mobile|Android|iPhone/i.test(ua);
                        return (
                          <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 text-xs font-medium text-foreground">{log.action.replace(/user\./, "").replace(/\./g, " ")}</td>
                            <td className="p-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Smartphone className="size-3" />{isMobile ? "جوال" : "حاسوب"}</span></td>
                            <td className="p-3 text-xs text-muted-foreground tabular-nums">{log.ip ?? "—"}</td>
                            <td className="p-3"><Badge variant="outline" className={isSuccess ? "bg-secondary/10 text-secondary border-secondary/30" : isFail ? "bg-red-100 text-red-700 dark:bg-red-900/30" : "bg-muted text-muted-foreground"}>{isSuccess ? "نجح" : isFail ? "فشل" : log.severity}</Badge></td>
                            <td className="p-3 text-xs text-muted-foreground">{formatDateArabic(log.createdAt)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
