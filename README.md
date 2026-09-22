# سيدي يوسف بن علي العاصمة — منصة المعروف الرقمي

> "من حي إلى عاصمة... المعروف الرقمي"

منصة ويب اجتماعية تضامنية لرقمنة «المعروف المغربي» — نظام التضامن التقليدي في الأفراح والأتراح والمرض والحاجات — داخل حي سيدي يوسف بن علي بمراكش، ثم التوسع لأحياء أخرى.

---

## 🚀 Quick Start (5 أوامر فقط)

```bash
git clone <repo-url> && cd syba-community
bun install
cp .env.example .env  # ثم عدّل القيم
bun run db:push && bun run db:seed
bun run dev           # http://localhost:3000
```

سجّل دخول (انظر بيانات الاعتماد في وضع DEMO عبر `/demo-access` — محمي بـDEMO_MODE=true).

---

## 🧪 الاختبار المحلي

### MailHog (SMTP محلي)
```bash
bun run scripts/mailhog-server.ts &
# SMTP: localhost:1025
# Web UI: http://localhost:8025
```

### اختبار 2FA بـotpauth
```bash
# بعد تفعيل 2FA في المنصة، احصل على الـsecret
bun run scripts/totp-gen.ts <base32-secret>
# → يطبع رمز 6 أرقام صالح 30 ثانية
```

### قياس الأداء (Web Vitals)
```bash
bun run scripts/measure-vitals.ts
# → يقيس TTFB, FCP, LCP, CLS على 5 صفحات
```

---

## 🌍 الإنتاج

### ⚠️ تحذيرات صارمة
- **`DEMO_MODE=false`** إلزامي — `/demo-access` يعود 404
- **`NEXTAUTH_SECRET`** جديد: `openssl rand -hex 32`
- **`SMTP_ENABLED=true`** فقط بعد إضافة بيانات Brevo
- **2FA** إلزامي للمشرف العام
- **IP allowlist** يُفعّل في `/admin/settings/security/ips`

### البريد الإنتاجي
- **Brevo** (مجاني، 300 بريد/يوم): [brevo.com](https://brevo.com)
- SMTP: `smtp-relay.brevo.com:587`
- أضف بيانات الاعتماد في Vercel Environment Variables

---

## 🔑 الحسابات التجريبية (في وضع العرض)

كلمة المرور: (انظر `/demo-access` في وضع DEMO فقط — محمي بـDEMO_MODE=true)

| الدور | البريد | الصلاحيات |
|------|--------|----------|
| مشرف عام | `admin@syba-community.ma` (demo فقط) | كل الصلاحيات |
| أمين الصندوق | `treasurer@syba-community.ma` | تأكيد المساهمات + صرف الطلبات < 1000 |
| عضو لجنة نزاهة (5) | `user5@...` إلى `user9@...` | تصويت على الطلبات > 1000 |
| مشرف حي | (موجود في DB) | إدارة محتوى الحي |
| عضو عادي (188) | (موجودون في DB) | مساهمة + طلب + انضمام |

**جرّب بسرعة**: `/demo-access` (في وضع DEMO_MODE=true فقط).

---

## 🛡️ الأمان

| الميزة | الوصف |
|--------|------|
| **2FA TOTP** | speakeasy + qrcode + 10 backup codes — `/admin/settings/security` |
| **IP Allowlist** | middleware + 403 page — `/admin/settings/security/ips` |
| **RBAC** | 8 أدوار + 56 صلاحية هرمية |
| **Audit Log** | كل عملية حرجة مسجّلة (8 أنواع actions) |
| **Session** | JWT + httpOnly + sameSite=lax + maxAge 30 يوم |
| **bcrypt** | كلمة المرور + قفل بعد 5 محاولات فاشلة |
| **Soft Delete** | `deletedAt` على كل النماذج |
| **State Machine** | طلبات الصندوق لا تتجاوز المراحل |

---

## 📁 بنية المشروع

```
src/
├── app/                    # Next.js 16 App Router
│   ├── (صفحات عامة): /, /login, /register, /403, /demo-access, /tour
│   ├── community/         # 8 صفحات للمستخدم
│   ├── admin/             # 25 صفحة للأدمن (16 قسم رئيسي + فرعية)
│   └── api/               # 61 API route
├── components/
│   ├── ui/                # shadcn/ui primitives
│   ├── layout/            # Header/Footer/BottomNav/AppChrome/middleware
│   ├── shared/            # SiteLogo/ZelligeDivider/ThemeToggle
│   ├── community/, admin/, demo/, providers/
├── lib/
│   ├── db.ts, auth.ts, roles.ts, constants.ts
│   ├── fund-stats.ts      # مصدر موحّد للأرقام المالية (cached)
│   ├── fund-state-machine.ts  # آلة حالة الطلبات
│   ├── two-factor.ts      # 2FA TOTP
│   ├── ip-allowlist.ts    # IP allowlist helper
│   ├── mailer.ts          # SMTP (nodemailer)
│   └── qr-code.ts         # QR generation
├── emails/                # 7 قوالب بريد عربية RTL
├── middleware.ts          # حماية IP allowlist
├── scripts/               # totp-gen, mailhog-server, measure-vitals
└── prisma/
    ├── schema.prisma      # 17 نموذج + 15 Enum
    └── seed.ts            # بيانات مغربية واقعية
```

---

## 🎨 الهوية البصرية

**لوحة الألوان (زليج مراكش)**:
- ترابي الزليج `#B8492B` (Primary)
- أخضر الصنوبر `#2D5A3D` (Secondary)
- كريم الجبس `#FBF6EE` (Background)
- ذهبي النحاس `#C8842A` (Accent)

**الخطوط** (محلية 100%): Tajawal (عناوين) + IBM Plex Sans Arabic (نصوص)

---

## 📋 الأوامر

```bash
bun run dev          # تشغيل التطوير
bun run lint         # فحص ESLint
bun run db:push      # دفع الـschema
bun run db:seed      # ملء البيانات التجريبية
bun run db:reset     # إعادة ضبط
```

---

## ⚠️ الفجوات المعروفة

**لا فجوات معروفة.** كل الميزات مُنفّذة ومُختبَرة بأدلة فعلية.

انظر `CHANGELOG.md` للإحصاء الكامل و`worklog.md` للسجل التفصيلي.

---

## 📚 الوثائق

- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — Vercel + Supabase + Brevo + VPS مغربي
- [`docs/ADMIN-GUIDE-AR.md`](./docs/ADMIN-GUIDE-AR.md) — دليل عربي كامل للمشرف
- [`docs/POST-DEPLOYMENT-CHECKLIST.md`](./docs/POST-DEPLOYMENT-CHECKLIST.md) — Checklist بعد النشر
- [`CHANGELOG.md`](./CHANGELOG.md) — سجل التغييرات
- [`worklog.md`](./worklog.md) — سجل التنفيذ الكامل (المراحل 0-11)

---

*"إنّ الله في عون العبد ما دام العبد في عون أخيه"*

**© 2026 سيدي يوسف بن علي العاصمة. من حي إلى عاصمة.**
