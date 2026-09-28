import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SiteControlClient } from "@/components/admin/site-control-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "مركز التحكم الشامل" };

export default async function SiteControlPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login?callbackUrl=/admin/site-control");

  const flags = await db.featureFlag.findMany({
    orderBy: [{ category: "asc" }, { key: "asc" }],
    select: { id: true, key: true, category: true, status: true, isEnabled: true, descriptionAr: true },
  });

  return <SiteControlClient initialFlags={flags} />;
}
