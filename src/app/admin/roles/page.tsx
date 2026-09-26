import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
const ROLES = [
  { name: "GUEST", nameAr: "زائر", permissions: ["blog.read"] },
  { name: "MEMBER", nameAr: "عضو", permissions: ["community.read", "fund.read", "events.read", "blog.read"] },
  { name: "GROUP_LEADER", nameAr: "قائد مجموعة", permissions: ["community.read", "blog.read", "events.read"] },
  { name: "DISTRICT_MODERATOR", nameAr: "مشرف حي", permissions: ["community.read", "community.moderate", "blog.read", "users.read"] },
  { name: "ADS_MANAGER", nameAr: "مدير إعلانات", permissions: ["ads.read", "ads.create", "ads.update", "ads.manage"] },
  { name: "ETHICS_COMMITTEE", nameAr: "لجنة أخلاقيات", permissions: ["fund.read", "users.read", "community.moderate"] },
  { name: "TREASURER", nameAr: "أمين صندوق", permissions: ["fund.read", "fund.approve", "fund.disburse", "fund.export"] },
  { name: "SUPER_ADMIN", nameAr: "سوبر أدمن", permissions: "ALL (50 صلاحية كاملة)" },
];
export default async function AdminRolesPage() {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "DISTRICT_MODERATOR"].includes(user.role)) redirect("/login?callbackUrl=/admin/roles");
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <header className="mb-6"><h1 className="font-heading text-2xl font-bold flex items-center gap-2"><span>🎭</span><span>الأدوار والصلاحيات</span></h1><p className="text-sm text-muted-foreground">{ROLES.length} أدوار نظامية</p></header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ROLES.map(r => (
          <div key={r.name} className="rounded-lg border p-4 space-y-2">
            <h3 className="font-heading font-bold text-sm">{r.nameAr}</h3>
            <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono" dir="ltr">{r.name}</code>
            <div className="pt-2 border-t"><p className="text-xs text-muted-foreground mb-1">الصلاحيات:</p>{Array.isArray(r.permissions) ? r.permissions.map(p => <span key={p} className="inline-block text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5 m-0.5 font-mono">{p}</span>) : <span className="text-xs text-red-600 font-bold">{r.permissions}</span>}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
