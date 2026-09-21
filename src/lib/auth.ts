// ===================================================================
//  NextAuth.js — التكوين الكامل
//  - Credentials Provider (بريد + كلمة مرور)
//  - محاكاة OTP (رمز ثابت: 123456 في وضع Demo)
//  - JWT strategy (بدون قاعدة بيانات للجلسات)
//  - Callbacks: jwt, session (إضافة role, districtId, familyId)
// ===================================================================

import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { ROLE_LABELS } from "@/lib/constants";
import { hasPermission } from "@/lib/roles";
import type { Role } from "@prisma/client";

// ===================================================================
//  محاكاة OTP — رمز ثابت في وضع Demo
//  في الإنتاج: استبدل بـ Brevo SMS API (300 رسالة/يوم مجاناً)
// ===================================================================

export const DEMO_OTP_CODE = "123456";

/** محاكاة إرسال OTP — يُرجع الرمز للعرض في وضع Demo */
export function generateOtpDemo(phone: string): { code: string; debug: string } {
  // في وضع الإنتاج: استدعِ مزود SMS هنا (Brevo, Twilio, إلخ)
  void phone; // معلّق — فقط لتفادي تحذير عدم الاستخدام
  return {
    code: DEMO_OTP_CODE,
    debug: `[Demo Mode] OTP code for ${phone}: ${DEMO_OTP_CODE}`,
  };
}

// ===================================================================
//  تكوين NextAuth
// ===================================================================

export const authOptions: NextAuthOptions = {
  // لا نستخدم adapter — الجلسات بـ JWT فقط (للتوافق مع Serverless)
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 يوماً
    updateAge: 24 * 60 * 60, // تحديث كل 24 ساعة
  },
  // إعدادات الكوكيز — حرج لاستمرار الجلسة عبر التنقّل والـrefresh
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 يوماً
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
    error: "/login",
    verifyRequest: "/verify-request",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "البريد وكلمة المرور",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("البريد وكلمة المرور مطلوبان");
        }

        const email = credentials.email.toLowerCase().trim();

        // البحث عن المستخدم
        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            fullName: true,
            passwordHash: true,
            role: true,
            status: true,
            phone: true,
            districtId: true,
            familyId: true,
            isFamilyHead: true,
            avatar: true,
            emailVerified: true,
            failedLoginCount: true,
            lockedUntil: true,
          },
        });

        if (!user) {
          throw new Error("لا يوجد حساب بهذا البريد الإلكتروني");
        }

        // فحص القفل
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("تم قفل حسابك مؤقتاً بعد محاولات فاشلة. حاول لاحقاً");
        }

        // فحص الحالة
        if (user.status === "DISABLED") {
          throw new Error("تم تعطيل هذا الحساب. تواصل مع الإدارة");
        }
        if (user.status === "SUSPENDED") {
          throw new Error("تم إيقاف هذا الحساب مؤقتاً. تواصل مع الإدارة");
        }
        if (user.status === "PENDING") {
          throw new Error("حسابك بانتظار التحقق. تواصل مع الإدارة");
        }

        // التحقق من كلمة المرور
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          // زيادة عدّاد المحاولات الفاشلة
          const newCount = (user.failedLoginCount ?? 0) + 1;
          const lockUntil =
            newCount >= 5
              ? new Date(Date.now() + 15 * 60 * 1000) // قفل 15 دقيقة بعد 5 محاولات
              : null;

          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: newCount,
              lockedUntil: lockUntil,
            },
          });

          throw new Error("كلمة المرور غير صحيحة");
        }

        // تصفير عدّاد المحاولات الفاشلة + تحديث آخر دخول
        await db.user.update({
          where: { id: user.id },
          data: {
            failedLoginCount: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        });

        // إرجاع الكائن الذي يُخزَّن في الـJWT
        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          districtId: user.districtId,
          familyId: user.familyId,
          isFamilyHead: user.isFamilyHead,
          status: user.status,
          phone: user.phone,
          avatar: user.avatar,
        } as const;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // عند الدخول الأول: نسخ بيانات المستخدم إلى الـtoken
      if (user) {
        const u = user as typeof user & {
          id: string;
          role: Role;
          districtId: string;
          familyId: string | null;
          isFamilyHead: boolean;
          status: string;
          phone: string;
          avatar: string | null;
        };
        token.id = u.id;
        token.role = u.role;
        token.districtId = u.districtId;
        token.familyId = u.familyId;
        token.isFamilyHead = u.isFamilyHead;
        token.status = u.status;
        token.phone = u.phone;
        token.avatar = u.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      // نسخ بيانات الـtoken إلى الـsession
      if (session.user) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as Role,
          districtId: token.districtId as string,
          familyId: token.familyId as string | null,
          isFamilyHead: token.isFamilyHead as boolean,
          status: token.status as string,
          phone: token.phone as string,
          avatar: token.avatar as string | null,
        } as typeof session.user;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // تسجيل دخول ناجح — أضف audit log (يمكن تنفيذه لاحقاً)
      try {
        const u = user as { id?: string };
        if (u.id) {
          await db.auditLog.create({
            data: {
              actorId: u.id,
              action: "user.login",
              entity: "User",
              entityId: u.id,
              severity: "info",
            },
          });
        }
      } catch {
        // فشل تسجيل الـaudit log لا يمنع الدخول
      }
    },
  },
  // ضبط مفتاح سري (في الإنتاج: استخدم NEXTAUTH_SECRET من البيئة)
  secret: process.env.NEXTAUTH_SECRET ?? "syba-community-mvp-secret-change-in-production",
  debug: false,
};

// ===================================================================
//  تعريض الأدوار في نوع Session
// ===================================================================
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email: string;
      image?: string | null;
      role: Role;
      districtId: string;
      familyId: string | null;
      isFamilyHead: boolean;
      status: string;
      phone: string;
      avatar: string | null;
    };
  }

  interface User {
    role: Role;
    districtId: string;
    familyId: string | null;
    isFamilyHead: boolean;
    status: string;
    phone: string;
    avatar: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    districtId: string;
    familyId: string | null;
    isFamilyHead: boolean;
    status: string;
    phone: string;
    avatar: string | null;
  }
}

// ===================================================================
//  أدوات مساعدة للوصول للجلسة في Server Components / API
//  (getServerSession مستورد في أعلى الملف)
// ===================================================================

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("يجب تسجيل الدخول للوصول لهذه الصفحة");
  }
  return user;
}

export async function requireRole(role: Role) {
  const user = await requireAuth();
  if (user.role !== role && user.role !== "SUPER_ADMIN") {
    throw new Error(`هذا الإجراء يتطلب دور: ${ROLE_LABELS[role].label}`);
  }
  return user;
}

export async function requirePermission(permission: Parameters<typeof hasPermission>[1]) {
  const user = await requireAuth();
  if (!hasPermission(user.role, permission)) {
    throw new Error(`ليس لديك صلاحية: ${permission}`);
  }
  return user;
}
