// ===================================================================
//  /api/internal/check-ip — فحص داخلي للـmiddleware
//  عام (بدون auth) لأن الـmiddleware يستخدمه قبل إنشاء session
// ===================================================================

import { NextResponse } from "next/server";
import { isIPAllowed } from "@/lib/ip-allowlist";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ip = searchParams.get("ip") || "";

  if (!ip) {
    return NextResponse.json({ allowed: false, reason: "no_ip" });
  }

  try {
    const result = await isIPAllowed(ip);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[check-ip] error:", error);
    // في حال الخطأ، اسمح بالمتابعة
    return NextResponse.json(
      { allowed: true, reason: "error_graceful" },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
