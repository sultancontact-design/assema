// ===================================================================
//  صفحة الفواتير — /admin/ads/invoices
//  Server Component — يولّد الفواتير آلياً من Ad
// ===================================================================

import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import {
  InvoicesTable,
  type InvoiceRow,
} from "@/components/admin/ads/invoices-table";
import { generateInvoiceNumber, toAdRow } from "@/lib/ads-utils";

export const dynamic = "force-dynamic";

export default async function AdminAdsInvoicesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!hasPermission(user.role, "ad.view")) return null;

  // جلب كل الإعلانات ذات amountPaid > 0
  const ads = await db.ad.findMany({
    where: {
      districtId: user.districtId ?? "",
      amountPaid: { gt: 0 },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const invoices: InvoiceRow[] = ads.map((ad) => {
    const row = toAdRow(ad);
    const invoiceNumber = generateInvoiceNumber(ad);
    return {
      ad: row,
      invoiceNumber,
      isPaid: ad.amountPaid > 0,
    };
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          الفواتير
        </h1>
        <p className="text-sm text-muted-foreground">
          {invoices.length} فاتورة — تُولَّد آلياً من حملات بقيمة مدفوعة &gt; 0.
        </p>
      </header>

      <InvoicesTable invoices={invoices} />
    </div>
  );
}
