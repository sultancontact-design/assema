import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// ===================================================================
//  POST /api/auth/register
//  ينشئ حساباً جديداً + سجل أسرة جديد في حي سيدي يوسف بن علي
// ===================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOROCCAN_PHONE_REGEX = /^0[5-7]\d{8}$/;
const DISTRICT_SLUG = "sidi-youssef-ben-ali";

interface RegisterPayload {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  phone?: unknown;
  password?: unknown;
  familyName?: unknown;
  address?: unknown;
  economicStatus?: unknown;
  memberCount?: unknown;
  profession?: unknown;
  skills?: unknown;
  interests?: unknown;
  gender?: unknown;
  birthDate?: unknown;
  nationalId?: unknown;
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function toOptionalString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

function serverError(message = "حدث خطأ في الخادم") {
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function POST(req: NextRequest) {
  try {
    const body: RegisterPayload = await req.json().catch(() => ({}));

    // =================================================================
    //  1) استخراج القيم وضبط الأنواع
    // =================================================================
    const firstName = isString(body.firstName) ? body.firstName.trim() : "";
    const lastName = isString(body.lastName) ? body.lastName.trim() : "";
    const email = isString(body.email) ? body.email.trim().toLowerCase() : "";
    const phone = isString(body.phone) ? body.phone.trim() : "";
    const password = isString(body.password) ? body.password : "";
    const familyName = isString(body.familyName) ? body.familyName.trim() : "";
    const address = toOptionalString(body.address);
    const economicStatus = isString(body.economicStatus)
      ? body.economicStatus.trim()
      : "متوسط";
    const memberCountRaw = body.memberCount;
    const memberCount =
      typeof memberCountRaw === "number"
        ? memberCountRaw
        : isString(memberCountRaw)
        ? Number(memberCountRaw)
        : NaN;
    const profession = toOptionalString(body.profession);
    const skills = toOptionalString(body.skills);
    const interests = toOptionalString(body.interests);
    const gender = isString(body.gender) && body.gender ? body.gender : null;
    const birthDate =
      isString(body.birthDate) && body.birthDate
        ? new Date(body.birthDate)
        : null;
    const nationalId = toOptionalString(body.nationalId);

    // =================================================================
    //  2) التحقّق من الحقول المطلوبة
    // =================================================================
    if (!firstName) return badRequest("الاسم الشخصي مطلوب");
    if (!lastName) return badRequest("اسم العائلة مطلوب");
    if (!email) return badRequest("البريد الإلكتروني مطلوب");
    if (!EMAIL_REGEX.test(email))
      return badRequest("صيغة البريد الإلكتروني غير صحيحة");
    if (!phone) return badRequest("رقم الهاتف مطلوب");
    if (!MOROCCAN_PHONE_REGEX.test(phone))
      return badRequest(
        "رقم الهاتف يجب أن يكون بصيغة مغربية: 05/06/07 متبوعاً بـ 8 أرقام"
      );
    if (!password) return badRequest("كلمة المرور مطلوبة");
    if (password.length < 8)
      return badRequest("كلمة المرور يجب ألاّ تقلّ عن 8 أحرف");
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password))
      return badRequest("كلمة المرور يجب أن تحتوي على حرف ورقم على الأقل");
    if (!familyName) return badRequest("اسم العائلة الجديدة مطلوب");
    if (!Number.isFinite(memberCount) || memberCount < 1)
      return badRequest("عدد الأفراد يجب أن يكون عدداً صحيحاً موجباً");

    const validEconomicStatuses = ["ضعيف", "متوسط", "جيد"];
    if (!validEconomicStatuses.includes(economicStatus)) {
      return badRequest("الحالة الاقتصادية يجب أن تكون: ضعيف أو متوسط أو جيد");
    }
    if (gender && !["ذكر", "أنثى"].includes(gender)) {
      return badRequest("الجنس يجب أن يكون: ذكر أو أنثى");
    }
    if (birthDate && isNaN(birthDate.getTime())) {
      return badRequest("تاريخ الميلاد غير صحيح");
    }

    // =================================================================
    //  3) التحقّق من تفرد البريد والهاتف
    // =================================================================
    const existingEmail = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingEmail) {
      return conflict("هذا البريد الإلكتروني مسجّل بالفعل");
    }

    const existingPhone = await db.user.findUnique({
      where: { phone },
      select: { id: true },
    });
    if (existingPhone) {
      return conflict("رقم الهاتف مسجّل بالفعل");
    }

    // =================================================================
    //  4) إنشاء كلمة المرور المشفّرة + (اختيارياً) تجزئة البطاقة الوطنية
    // =================================================================
    const passwordHash = await bcrypt.hash(password, 10);
    const nationalIdHash = nationalId ? await bcrypt.hash(nationalId, 10) : null;

    // =================================================================
    //  5) الحصول على الحي الافتراضي (أو إنشائه إن لم يوجد)
    // =================================================================
    let district = await db.district.findUnique({
      where: { slug: DISTRICT_SLUG },
      select: { id: true },
    });

    if (!district) {
      district = await db.district.create({
        data: {
          name: "سيدي يوسف بن علي",
          slug: DISTRICT_SLUG,
          city: "مراكش",
          region: "مراكش آسفي",
          description: "حي شعبي عريق في قلب مدينة مراكش",
          isActive: true,
          isDefault: true,
        },
        select: { id: true },
      });
    }

    // =================================================================
    //  6) إنشاء الأسرة + المستخدم ضمن معاملة واحدة
    //     نحلّ التبعية الدائرية: نُنشئ الأسرة بدون headOfFamilyId أولاً،
    //     ثم نُنشئ المستخدم، ثم نُحدّث الأسرة لتربطه كربّ أسرة.
    // =================================================================
    const fullName = `${firstName} ${lastName}`;

    const result = await db.$transaction(async (tx) => {
      // (أ) إنشاء الأسرة بدون رب أسرة
      const family = await tx.family.create({
        data: {
          familyName,
          districtId: district!.id,
          address: address,
          economicStatus,
          memberCount: Math.min(Math.max(Math.floor(memberCount), 1), 30),
          isActive: true,
        },
        select: { id: true },
      });

      // (ب) إنشاء المستخدم وربطه بالأسرة كربّ أسرة
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          fullName,
          email,
          phone,
          nationalIdHash,
          passwordHash,
          districtId: district!.id,
          familyId: family.id,
          isFamilyHead: true,
          role: "MEMBER",
          status: "ACTIVE",
          emailVerified: new Date(),
          profession,
          skills,
          interests,
          gender,
          birthDate,
        },
        select: { id: true },
      });

      // (ج) ربط الأسرة بربّها
      await tx.family.update({
        where: { id: family.id },
        data: { headOfFamilyId: user.id },
      });

      return { userId: user.id, familyId: family.id };
    });

    return NextResponse.json(
      {
        success: true,
        userId: result.userId,
        familyId: result.familyId,
      },
      { status: 201 }
    );
  } catch (err) {
    // أخطاء Prisma المرتبطة بالقيود
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unique constraint")) {
      return conflict("بياناتك مكررة — تحقّق من البريد أو الهاتف");
    }
    console.error("[register] error:", msg);
    return serverError();
  }
}
