// ===================================================================
//  /api/internal/my-ip — يُرجع IP الزائر
// ===================================================================

import { NextResponse } from "next/server";
import { getClientIP } from "@/lib/ip-allowlist";

export async function GET(request: Request) {
  const ip = getClientIP(request.headers);
  return NextResponse.json({ ip });
}
