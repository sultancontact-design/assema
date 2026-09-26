import { getCurrentUser } from "@/lib/auth";
import { StoreClient } from "@/components/community/store-client";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const user = await getCurrentUser().catch(() => null);
  return <StoreClient userPoints={user?.points ?? null} />;
}
