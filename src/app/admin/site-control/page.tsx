"use client";

import * as React from "react";
import { SiteControlClient } from "@/components/admin/site-control-client";

export const dynamic = "force-dynamic";

export default function SiteControlPage() {
  return <SiteControlClient initialFlags={[]} />;
}
