// ===================================================================
//  API: صندوق المعروف — المساهمات (Contributions)
//  POST  /api/fund/contributions      → إنشاء مساهمة جديدة
//  GET   /api/fund/contributions      → آخر 10 مساهمات للمستخدم الحالي
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import * as ContributionReceiptEmail from "@/emails/contribution-receipt";

// ===================================================================
//  POST — إنشاء مساهمة جديدة
// ===================================================================

export async function POST(request: NextRequest) {
  try {
    // 1) التحقّق من المصادقة
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول لإجراء مساهمة" },
        { status: 401 }
      );
    }

    // 2) التحقّق من وجود أسرة للمستخدم
    if (!user.familyId) {
      return NextResponse.json(
        { error: "حسابك غير مربوط بأسرة. تواصل مع الإدارة لإصلاح هذا" },
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

    const { amount, month, method, bankReference, note } = body as {
      amount?: number;
      month?: string;
      method?: string;
      bankReference?: string;
      note?: string;
    };

    // 4) التحقّق من المدخلات
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "المبلغ يجب أن يكون عدداً موجباً" },
        { status: 400 }
      );
    }
    if (amount > 5000) {
      return NextResponse.json(
        { error: "الحد الأقصى للمساهمة الواحدة هو 5000 درهم" },
        { status: 400 }
      );
    }
    if (!method || !["BANK_TRANSFER", "CASH", "CMI"].includes(method)) {
      return NextResponse.json(
        { error: "طريقة الدفع غير صحيحة" },
        { status: 400 }
      );
    }

    // التحقّق من الشهر (YYYY-MM)
    const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    const monthValue = month && monthRegex.test(month) ? month : undefined;
    if (!monthValue) {
      return NextResponse.json(
        { error: "صيغة الشهر غير صحيحة (YYYY-MM)" },
        { status: 400 }
      );
    }

    const year = parseInt(monthValue.slice(0, 4), 10);

    // 5) توليد رقم الإيصال الرقمي
    const now = new Date();
    const y = now.getFullYear();
    const seqCount = await db.contribution.count({
      where: {
        receiptNumber: { startsWith: `RC-${y}-` },
      },
    });
    const receiptNumber = `RC-${y}-${String(seqCount + 1).padStart(4, "0")}`;
    const digitalReceipt = randomUUID();

    // 6) إنشاء المساهمة في قاعدة البيانات
    const contribution = await db.contribution.create({
      data: {
        userId: user.id,
        familyId: user.familyId,
        districtId: user.districtId,
        amount,
        month: monthValue,
        year,
        method: method as "BANK_TRANSFER" | "CASH" | "CMI",
        receiptNumber,
        digitalReceipt,
        bankReference: bankReference?.trim() || null,
        note: note?.trim() || null,
        status: "PENDING",
      },
      include: {
        family: {
          select: { id: true, familyName: true },
        },
      },
    });

    // 7) إنشاء إشعار لأمين الصندوق
    const treasurers = await db.user.findMany({
      where: {
        role: "TREASURER",
        districtId: user.districtId,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    if (treasurers.length > 0) {
      await db.notification.createMany({
        data: treasurers.map((t) => ({
          userId: t.id,
          type: "CONTRIBUTION",
          title: "مساهمة جديدة بانتظار التأكيد",
          message: `مساهمة بقيمة ${amount} درهم من ${receiptNumber}`,
          link: "/community/fund",
          metadata: JSON.stringify({ contributionId: contribution.id }),
        })),
      });
    }

    // 8) تسجيل تدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "fund.contribution.created",
        entity: "Contribution",
        entityId: contribution.id,
        metadata: JSON.stringify({
          amount,
          method,
          month: monthValue,
          receiptNumber,
        }),
        severity: "info",
      },
    });

    // 9) إرسال بريد إيصال المساهمة (غير حرج)
    try {
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { email: true, fullName: true },
      });
      if (dbUser?.email) {
        const params = {
          userName: dbUser.fullName || user.name || "الفاضل",
          amount,
          receiptNumber,
          digitalReceipt,
          month: monthValue,
          method: method as "BANK_TRANSFER" | "CASH" | "CMI",
        };
        await sendMail({
          to: dbUser.email,
          subject: ContributionReceiptEmail.subject(params),
          html: ContributionReceiptEmail.html(params),
        });
      }
    } catch (mailErr) {
      console.error("[contributions] receipt email failed:", mailErr);
    }

    return NextResponse.json(
      {
        contribution,
        receiptNumber,
        digitalReceipt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/fund/contributions error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة المساهمة" },
      { status: 500 }
    );
  }
}

// ===================================================================
//  GET — آخر 10 مساهمات للمستخدم الحالي
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

    const contributions = await db.contribution.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        family: {
          select: { id: true, familyName: true },
        },
      },
    });

    return NextResponse.json({ contributions });
  } catch (error) {
    console.error("GET /api/fund/contributions error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء استرجاع المساهمات" },
      { status: 500 }
    );
  }
}
