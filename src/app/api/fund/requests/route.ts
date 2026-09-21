// ===================================================================
//  API: صندوق المعروف — الطلبات (Fund Requests)
//  POST  /api/fund/requests    → إنشاء طلب جديد
//  GET   /api/fund/requests    → آخر 10 طلبات للمستخدم الحالي
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ETHICS_COMMITTEE_THRESHOLD } from "@/lib/constants";
import type { FundRequestType } from "@prisma/client";

const VALID_TYPES: FundRequestType[] = [
  "MEDICAL",
  "DEATH",
  "WEDDING",
  "EDUCATION",
  "EMERGENCY",
  "MICRO_PROJECT",
];

// ===================================================================
//  POST — إنشاء طلب صرف جديد
// ===================================================================

export async function POST(request: NextRequest) {
  try {
    // 1) التحقّق من المصادقة
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول لتقديم طلب" },
        { status: 401 }
      );
    }

    // 2) التحقّق من وجود أسرة
    if (!user.familyId) {
      return NextResponse.json(
        { error: "حسابك غير مربوط بأسرة. تواصل مع الإدارة" },
        { status: 400 }
      );
    }

    // 3) استخراج الجسم
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "البيانات غير صحيحة" },
        { status: 400 }
      );
    }

    const { type, title, description, amountRequested, location } = body as {
      type?: string;
      title?: string;
      description?: string;
      amountRequested?: number;
      location?: string;
    };

    // 4) التحقّق من النوع
    if (!type || !VALID_TYPES.includes(type as FundRequestType)) {
      return NextResponse.json(
        { error: "نوع الطلب غير صحيح" },
        { status: 400 }
      );
    }

    // 5) التحقّق من العنوان
    if (!title || title.trim().length < 5) {
      return NextResponse.json(
        { error: "العنوان يجب ألاّ يقلّ عن 5 أحرف" },
        { status: 400 }
      );
    }

    // 6) التحقّق من الوصف
    if (!description || description.trim().length < 20) {
      return NextResponse.json(
        { error: "الوصف يجب ألاّ يقلّ عن 20 حرفاً" },
        { status: 400 }
      );
    }

    // 7) التحقّق من المبلغ
    if (
      !amountRequested ||
      typeof amountRequested !== "number" ||
      amountRequested <= 0
    ) {
      return NextResponse.json(
        { error: "المبلغ المطلوب يجب أن يكون عدداً موجباً" },
        { status: 400 }
      );
    }
    if (amountRequested > 20000) {
      return NextResponse.json(
        { error: "الحد الأقصى للطلب الواحد هو 20000 درهم" },
        { status: 400 }
      );
    }

    // 8) حساب إن كان يحتاج لجنة النزاهة
    const requiresEthics = amountRequested > ETHICS_COMMITTEE_THRESHOLD;

    // 9) توليد الرمز المجهول (SY-XXX)
    const totalRequests = await db.fundRequest.count();
    const anonymousCode = `SY-${String(totalRequests + 1).padStart(3, "0")}`;

    // 10) إنشاء الطلب
    const newRequest = await db.fundRequest.create({
      data: {
        userId: user.id,
        familyId: user.familyId,
        districtId: user.districtId,
        type: type as FundRequestType,
        title: title.trim(),
        description: description.trim(),
        amountRequested,
        location: location?.trim() || null,
        status: "SUBMITTED",
        requiresEthics,
        anonymousCode,
      },
    });

    // 11) إشعارات للجنة النزاهة (فقط إذا كان يتطلب موافقتهم)
    if (requiresEthics) {
      const ethicsMembers = await db.user.findMany({
        where: {
          role: "ETHICS_COMMITTEE",
          districtId: user.districtId,
          status: "ACTIVE",
        },
        select: { id: true },
      });

      if (ethicsMembers.length > 0) {
        await db.notification.createMany({
          data: ethicsMembers.map((m) => ({
            userId: m.id,
            type: "FUND_REQUEST",
            title: "طلب جديد بانتظار تصويتك",
            message: `طلب ${anonymousCode} يفوق ${ETHICS_COMMITTEE_THRESHOLD} درهم ويحتاج موافقة اللجنة`,
            link: "/community/fund",
            metadata: JSON.stringify({ requestId: newRequest.id }),
          })),
        });
      }
    }

    // 12) إشعار للمستخدم بأنّ طلبه قُدِّم
    await db.notification.create({
      data: {
        userId: user.id,
        type: "FUND_REQUEST",
        title: "تمّ تقديم طلبك بنجاح",
        message: `طلبك برمز ${anonymousCode} أصبح قيد المراجعة`,
        link: "/community/fund",
        metadata: JSON.stringify({ requestId: newRequest.id }),
      },
    });

    // 13) تسجيل تدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "fund.request.created",
        entity: "FundRequest",
        entityId: newRequest.id,
        metadata: JSON.stringify({
          type,
          amountRequested,
          requiresEthics,
          anonymousCode,
        }),
        severity: "info",
      },
    });

    return NextResponse.json(
      {
        request: newRequest,
        anonymousCode,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/fund/requests error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}

// ===================================================================
//  GET — آخر 10 طلبات للمستخدم الحالي
// ===================================================================

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    const requests = await db.fundRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        _count: {
          select: { approvals: true },
        },
      },
    });

    const result = requests.map((r) => {
      const { _count, ...rest } = r;
      void _count;
      return { ...rest, approvalsCount: _count?.approvals ?? 0 };
    });

    return NextResponse.json({ requests: result });
  } catch (error) {
    console.error("GET /api/fund/requests error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء استرجاع الطلبات" },
      { status: 500 }
    );
  }
}
