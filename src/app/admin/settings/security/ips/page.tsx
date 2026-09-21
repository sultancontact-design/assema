import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import { IPAllowlistTable } from "@/components/admin/ip-allowlist-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert } from "lucide-react";

export default async function IPAllowlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/settings/security/ips");
  if (!hasPermission(user.role, "admin.settings")) {
    redirect("/community");
  }

  const [ips, setting] = await Promise.all([
    db.allowedIP.findMany({
      orderBy: { createdAt: "desc" },
    }),
    db.setting.findUnique({
      where: { key: "security.ip_allowlist.enabled" },
    }),
  ]);

  const enabled = setting?.value === "true";
  const activeCount = ips.filter((ip) => ip.isActive).length;

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">قائمة IP المسموح بها</h1>
          <p className="text-sm text-muted-foreground mt-1">
            حماية المنصة بالسماح فقط لعناوين IP المُدرجة بالوصول.
          </p>
        </div>
        <Badge variant={enabled ? "default" : "secondary"}>
          {enabled ? (
            <>
              <ShieldCheck className="size-3.5 ms-1" />
              مُفعّلة
            </>
          ) : (
            <>
              <ShieldAlert className="size-3.5 ms-1" />
              معطّلة
            </>
          )}
        </Badge>
      </div>

      {/* إحصاءات */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">إجمالي IPs</p>
            <p className="text-2xl font-bold mt-1">{ips.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">نشطة</p>
            <p className="text-2xl font-bold mt-1 text-secondary">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">الحالة</p>
            <p className="text-sm font-bold mt-1">{enabled ? "مُفعّلة" : "معطّلة"}</p>
          </CardContent>
        </Card>
      </div>

      {enabled && ips.length === 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldAlert className="size-5 text-destructive mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-destructive mb-1">تحذير حرج</p>
              <p className="text-muted-foreground">
                قائمة IP مُفعّلة ولكن لا توجد أي IP مدرجة. قد تُحظر نفسك عن
                المنصة. أضف IP على الأقل قبل التفعيل.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <IPAllowlistTable ips={ips} enabled={enabled} />
    </div>
  );
}
