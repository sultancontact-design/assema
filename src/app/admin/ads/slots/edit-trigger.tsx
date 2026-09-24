"use client";

// ===================================================================
//  EditSlotButton — زرّ "تعديل" لكل صف يفتح AdSlotFormDialog
// ===================================================================

import * as React from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AdSlotFormDialog,
  type AdSlotRow,
} from "@/components/admin/ads/ad-slot-form-dialog";

export default function EditSlotButton({ slot }: { slot: AdSlotRow }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-9 min-w-11 gap-1.5"
        aria-label={`تعديل ${slot.name}`}
      >
        <Pencil className="size-3.5" />
        <span className="hidden sm:inline">تعديل</span>
      </Button>
      <AdSlotFormDialog
        mode="edit"
        slot={slot}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
