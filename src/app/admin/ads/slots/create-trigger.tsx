"use client";

// ===================================================================
//  CreateSlotButton — زرّ "إنشاء مساحة" يفتح AdSlotFormDialog
//  (client component منفصل لأن الصفحة server component)
// ===================================================================

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdSlotFormDialog } from "@/components/admin/ads/ad-slot-form-dialog";

export default function CreateSlotButton() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-11 gap-2 bg-foreground text-background hover:bg-foreground/90"
      >
        <Plus className="size-4" />
        <span>إنشاء مساحة</span>
      </Button>
      <AdSlotFormDialog
        mode="create"
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
