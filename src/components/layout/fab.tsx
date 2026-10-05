"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

/**
 * FAB v66.0 — Floating Action Button for quick posting (mobile only)
 * - 56px circle, Teal background, white Plus icon
 * - Positioned above BottomNav (bottom-20 right-4 in LTR, bottom-20 left-4 in RTL)
 * - Opens /feed (which has the Composer)
 */
export function Fab() {
  return (
    <Link
      href="/feed"
      className="md:hidden fixed bottom-20 end-4 z-40 size-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
      style={{ backgroundColor: "var(--primary)" }}
      aria-label="نشر سريع"
    >
      <Plus className="size-6 text-white" />
    </Link>
  );
}
