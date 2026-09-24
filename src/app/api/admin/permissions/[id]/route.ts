import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { revokeDownloadPermission } from "@/lib/pdf-permissions";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "admin.settings")) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const { id } = await params;
  await revokeDownloadPermission(id);
  return NextResponse.json({ success: true });
}
