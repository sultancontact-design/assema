import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const headers = new Headers(request.headers);
    const country = headers.get("x-vercel-ip-country") || "";
    const city = headers.get("x-vercel-ip-city") || "";
    const region = headers.get("x-vercel-ip-country-region") || "";
    const latitude = headers.get("x-vercel-ip-latitude") || "";
    const longitude = headers.get("x-vercel-ip-longitude") || "";

    return NextResponse.json({
      success: true,
      country, city, region,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      source: "vercel-headers",
    });
  } catch {
    return NextResponse.json({ success: false });
  }
}
