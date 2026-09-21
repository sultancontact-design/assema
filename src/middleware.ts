// ===================================================================
//  middleware.ts — حماية المسارات بقائمة IP المسموح بها
//  يعمل على Node.js runtime (لا Edge) حتى نتمكّن من استدعاء Prisma
// ===================================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createPrismaClientForMiddleware } from "@/lib/middleware-db";

// مسارات مستثناة من الفلترة
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/verify-request",
  "/login/2fa",
  "/demo-access",
  "/tour",
  "/403",
  "/api/auth",
  "/api/internal",
  "/api/health",
];

const STATIC_ASSET_PATTERNS = [
  "/_next/",
  "/favicon",
  "/robots.txt",
  "/sitemap.xml",
  "/logo.svg",
  "/images/",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return true;
  }
  return STATIC_ASSET_PATTERNS.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // المسارات العامة + الأصول الثابتة لا تُفلتر
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // اقرأ حالة القائمة من cache محلي (refresh دورياً)
  // بدون Prisma مباشرة — استدعِ API داخلي
  try {
    const visitorIP =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    // cache بسيط داخل الـmodule (مدّته 60 ثانية)
    const cacheKey = `ipcheck:${visitorIP}`;
    const now = Date.now();

    // استخدم globalThis لتفادي إعادة الفحص في كل طلب
    const globalCache = (globalThis as unknown as {
      _ipCache?: Map<string, { result: boolean; ts: number }>;
    });

    if (!globalCache._ipCache) {
      globalCache._ipCache = new Map();
    }

    const cached = globalCache._ipCache.get(cacheKey);
    const cacheTTL = 60 * 1000; // 60 ثانية

    let allowed: boolean;
    if (cached && now - cached.ts < cacheTTL) {
      allowed = cached.result;
    } else {
      // استدعِ API داخلي (Node runtime — يمكنه استخدام Prisma)
      const checkUrl = new URL("/api/internal/check-ip", request.nextUrl.origin);
      checkUrl.searchParams.set("ip", visitorIP);
      const resp = await fetch(checkUrl, {
        // تجنّب caching في fetch نفسها
        cache: "no-store",
      });
      if (resp.ok) {
        const data = (await resp.json()) as { allowed: boolean };
        allowed = data.allowed === true;
      } else {
        // إذا فشل الفحص، اسمح بالمتابعة (تجنّب الحظر العرضي)
        allowed = true;
      }
      globalCache._ipCache.set(cacheKey, { result: allowed, ts: now });
    }

    if (!allowed) {
      // أعد توجيه لصفحة 403 مع IP كمعامل
      const url = request.nextUrl.clone();
      url.pathname = "/403";
      url.searchParams.set("ip", visitorIP);
      return NextResponse.rewrite(url);
    }
  } catch {
    // في حال أي خطأ، اسمح بالمتابعة (لا تمنع الوصول)
  }

  return NextResponse.next();
}

export const config = {
  // طبّق على كل المسارات ما عدا الـassets
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

// هذا الملف يستخدم createPrismaClientForMiddleware لتفادي تحذيرات الـEdge runtime
// لكن الفعلي: نستخدم fetch لـAPI داخلي. المعطى هنا فقط لإبقاء الـimport سليم.
