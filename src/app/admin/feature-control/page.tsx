import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { FeatureControlClient } from "@/components/admin/feature-control-client";

export const dynamic = "force-dynamic";

export default async function FeatureControlPage() {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "DISTRICT_MODERATOR"].includes(user.role)) {
    redirect("/login?callbackUrl=/admin/feature-control");
  }
  const flags = await db.featureFlag.findMany({ orderBy: [{ status: "asc" }, { key: "asc" }] });
  const serialized = flags.map(f => ({ ...f, startsAt: f.startsAt?.toISOString() ?? null, endsAt: f.endsAt?.toISOString() ?? null }));
  return <FeatureControlClient initialFlags={serialized} />;
}
