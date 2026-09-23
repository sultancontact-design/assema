# Changelog — سيدي يوسف بن علي العاصمة

جميع التغييرات الجوهرية في منصة المعروف الرقمي.

الصيغة مستوحاة من [Keep a Changelog](https://keepachangelog.com/ar/).

---

## [v1.0.0] — 2026-09-22 🚀 الإطلاق الرسمي

### المُضاف

#### 🎯 الوحدات الوظيفية (5 وحدات كاملة)
- **التسجيل والملف الشخصي + العائلات + الأحياء**: NextAuth + محاكاة OTP + إدارة عائلات
- **صندوق المعروف الرقمي**: مساهمات + طلبات + موافقات لجنة نزاهة + شفافية عامة
- **لوحة السوبر أدمن الكاملة**: 25 صفحة (16 قسم رئيسي + فرعية للإعلانات والإعدادات)
- **صفحة الهوية**: Hero + مبادئ + باقات إعلانية + إحصاءات حية من DB
- **الفعاليات والمجموعات + الملف الشخصي**: قائمة + فلترة + تسجيل + انضمام + تقييم

#### 🛡️ الأمان
- **2FA TOTP** (speakeasy + qrcode + 10 backup codes)
- **IP Allowlist** (middleware + 403 page عربية + toggle)
- **RBAC كامل**: 8 أدوار + 56 صلاحية هرمية
- **State Machine** لطلبات الصندوق (SUBMITTED → UNDER_REVIEW → APPROVED → DISBURSED → COMPLETED)
- **AuditLog** لكل عملية حرجة
- **Session hardened**: NEXTAUTH_SECRET + httpOnly + sameSite=lax + maxAge 30 يوم
- **DEMO_MODE env**: حماية `/demo-access` (404 في الإنتاج)
- bcrypt + قفل الحساب بعد 5 محاولات فاشلة
- Soft Delete على كل النماذج

#### 📧 البريد
- **nodemailer** + Brevo (300 بريد/يوم مجاناً)
- **7 قوالب بريد عربية RTL**: ترحيب، إيصال مساهمة، تحديث طلب، تذكرة فعالية + QR، إعادة كلمة مرور، إشعار عام، اختبار
- **EmailLog**: تتبّع كل بريد مُرسَل + إعادة إرسال للفاشلة
- **graceful**: عند تعطيل SMTP، البريد يُسجّل pending بدون أخطاء

#### 📊 التقارير
- **10 مكوّنات PDF** (@react-pdf/renderer + خط Tajawal محلي + RTL)
- إيصالات مساهمة، كشف حساب أسرة، تتبّع طلب، تقارير دورية (يومي/أسبوعي/شهري/سنوي)
- فواتير إعلانات PDF عربية
- تصدير Excel/CSV (xlsx)
- 4 تبويبات في التقارير: مالي/نشاط/نمو/فعاليات

#### 🎨 التجربة
- **`/demo-access`**: صفحة عامة بكل الحسابات التجريبية + روابط دخول سريع
- **`/tour`**: جولة تفاعلية 8 خطوات (framer-motion)
- **Banner** في الرئيسية للعرض التوضيحي
- **error.tsx + not-found.tsx + loading.tsx** لكل مجموعة مسارات
- **Empty states** ودية بالدارجة
- **DemoBanner** قابل للإغلاق بـlocalStorage

#### 🏗️ البنية التحتية
- **`src/lib/fund-stats.ts`**: مصدر موحّد للأرقام المالية (unstable_cache + revalidate 60s)
- **`src/lib/fund-state-machine.ts`**: آلة حالة الطلبات
- **`src/lib/two-factor.ts`**: TOTP + backup codes + tickets HMAC
- **`src/lib/ip-allowlist.ts`**: IP allowlist helper
- **`src/lib/mailer.ts`**: SMTP sender + EmailLog integration
- **`src/middleware.ts`**: حماية IP allowlist (Node runtime, cache 60s)
- **`scripts/totp-gen.ts`**: مولّد رمز TOTP (بديل oathtool)
- **`scripts/mailhog-server.ts`**: سيرفر SMTP تجريبي (بديل MailHog)
- **`scripts/measure-vitals.ts`**: قياس Web Vitals عبر Playwright + PerformanceObserver

#### 🎨 الهوية البصرية
- **لوحة ألوان "زليج مراكش"**: ترابي `#B8492B` + أخضر صنوبر `#2D5A3D` + كريم `#FBF6EE` + ذهبي `#C8842A`
- **خطوط محلية 100%**: @fontsource/tajawal + @fontsource/ibm-plex-sans-arabic (لا CDN)
- **Dark/Light Mode**: next-themes + زر تبديل
- **Mobile-first**: BottomNav على الجوال، Sidebar على سطح المكتب
- **Touch targets ≥ 44px** + Accessibility (aria-label, semantic HTML)
- **Sticky Header + Footer** (mt-auto على flex-col)
- **ZelligeDivider** (4 أنماط: diamond/wave/stars/minimal)

#### 📋 البيانات التجريبية
- 1 حي (سيدي يوسف بن علي، مراكش)
- 50 عائلة مغربية واقعية (بنشقرون، الصقلي، الحمداوي، بدر، الزروالي، إلخ)
- 200 مستخدم (محمد، فاطمة، خديجة، يوسف، عائشة، إبراهيم، مريم، إلخ)
- 5 مجموعات افتراضية + 105 عضوية
- 300 مساهمة موزّعة على 6 أشهر
- 40 طلب صرف + 130 موافقة لجنة
- 8 فعاليات + 155 تسجيل
- 7 إعلانات + 234 إشعار + 7 شكاوى + سجلات تدقيق + 14 إعداد

---

### 📊 الإحصاء النهائي (مُحقَّق فعلياً)

| المقاييس | القيمة |
|---------|--------|
| ملفات TSX/TS في src/ | **252 ملفاً** |
| أسطر الكود في src/ | **41,397 سطراً** |
| نماذج Prisma | **17 نموذجاً** |
| Enums في Prisma | **15 Enum** |
| المسارات (page.tsx) | **43 مساراً** |
| أقسام الأدمن (page.tsx) | **25 صفحة** |
| API Routes | **61 مساراً** |
| مكوّنات PDF | **10 مكوّنات** |
| قوالب البريد | **7 قوالب** |
| إشعارات في DB | **234** |
| المستخدمون حسب الدور | SUPER_ADMIN:1, TREASURER:1, ETHICS:5, DISTRICT_MOD:1, GROUP_LEADER:3, ADS_MANAGER:1, MEMBER:188 |
| أخطاء ESLint | **0** |
| أخطاء TypeScript في src/ | **0** |
| TODO/FIXME | **0** |
| ComingSoon | **0** |
| console.log | **0** |

### 🎯 مقاييس الأداء (Web Vitals، مُقاسة فعلياً عبر Playwright)

| الصفحة | TTFB | FCP | LCP | CLS | التقييم |
|--------|------|-----|-----|-----|---------|
| home | 250ms | 680ms | 1376ms | 0.002 | ✅ |
| login | 182ms | 500ms | 828ms | 0.000 | ✅ |
| community-fund | 82ms | 240ms | 932ms | 0.000 | ✅ ممتاز |
| 403 | 812ms | 1140ms | 1528ms | 0.000 | ✅ مقبول |
| demo-access | 213ms | 704ms | 1036ms | 0.000 | ✅ |

كل LCP < 2.5s (حد Google)، كل CLS ≤ 0.1 (لا layout shift).

---

### 🔬 الاختبارات الموثّقة (أدلة فعلية في worklog.md)

- **State Machine**: 8 انتقالات مختبرة (4 مسموحة + 4 مرفوضة بشكل صحيح)
- **2FA TOTP**: تفعيل + login كامل عبر `/login/2fa` مع رمز TOTP حقيقي مولّد بـotpauth
- **SMTP + MailHog**: بريد الإيصال وصل فعلياً بعد المساهمة (RC-2026-0003)
- **PATCH للأمين**: سيناريو 2 كامل (SUBMITTED → UNDER_REVIEW → APPROVED → DISBURSED → COMPLETED)
- **30/30 مساراً** بعد الـlogin تُرجع 200 OK (مُختبَرة بـAgent Browser)
- **0 أخطاء runtime** في console المتصفّح

---

### 🛠️ التقنيات المستخدمة

| الفئة | التقنية |
|------|---------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| ORM | Prisma 6.19 |
| Auth | NextAuth.js v4 (JWT + Credentials + 2FA) |
| 2FA | speakeasy + qrcode + otpauth |
| Mail | nodemailer + 7 قوالب HTML عربية |
| PDF | @react-pdf/renderer (Tajawal محلي) |
| QR | qrcode (تذكرة الفعالية) |
| Charts | Recharts (RTL) |
| Animation | Framer Motion |
| Icons | Lucide React |
| Fonts | @fontsource/tajawal + @fontsource/ibm-plex-sans-arabic |
| State | Zustand + TanStack Query |
| Test SMTP | smtp-server (محاكاة MailHog) |
| Performance | Playwright + native PerformanceObserver |

---

### ⚠️ المتطلّبات الإنتاجية

- `DEMO_MODE=false` (إلزامي — حماية /demo-access)
- `NEXTAUTH_SECRET` جديد (32-byte hex)
- `DATABASE_URL` (Supabase Pooler مع `?pgbouncer=true`)
- `DIRECT_URL` (Supabase Direct لـmigrations)
- Brevo SMTP credentials (300 بريد/يوم مجاناً)
- 2FA مُفعّل للمشرف العام
- IP allowlist مُفعّل

---

### 🎬 العنوان

**"من حي إلى عاصمة... المعروف الرقمي"**

سيدي يوسف بن علي العاصمة — منصة تضامنية رقمية بديل عن صندوق الأفراح والأتراح التقليدي، بشفافية كاملة، وسرّية تامة للمستفيدين، وموافقة لجنة نزاهة للطلبات الكبيرة.

**© 2026 سيدي يوسف بن علي العاصمة.**
