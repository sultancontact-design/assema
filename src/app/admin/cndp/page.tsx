import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CndpAdminClient } from "@/components/admin/cndp-admin-client";

export const dynamic = "force-dynamic";

export default async function AdminCndpPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    redirect("/login?callbackUrl=/admin/cndp");
  }

  const requests = await db.cndpRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const serialized = requests.map((r) => ({
    id: r.id,
    fullName: r.fullName,
    email: r.email,
    phone: r.phone,
    nationalId: r.nationalId,
    requestType: r.requestType,
    description: r.description,
    targetData: r.targetData,
    status: r.status,
    adminResponse: r.adminResponse,
    assignedTo: r.assignedTo,
    expiresAt: r.expiresAt.toISOString(),
    processedAt: r.processedAt?.toISOString() ?? null,
    userId: r.userId,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return <CndpAdminClient requests={serialized} />;
}
