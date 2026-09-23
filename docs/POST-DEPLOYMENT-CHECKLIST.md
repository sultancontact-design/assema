# Checklist ما بعد النشر — سيدي يوسف بن علي العاصمة

> دليل صارم لإعداد وتشغيل المنصة بعد النشر على Vercel.

---

## 🚨 الإعداد الفوري (اليوم 1 — إلزامي)

### الأمان

- [ ] **`NEXTAUTH_SECRET` جديد** في Vercel Environment Variables
  - توليد: `openssl rand -hex 32`
  - في Vercel → Project → Settings → Environment Variables → Add

- [ ] **`DEMO_MODE=false`** في Vercel (إلزامي!)
  - يحمي `/demo-access` من الوصول العام
  - تحقّق: `https://[your-app].vercel.app/demo-access` يجب أن تعود 404

- [ ] **`NEXTAUTH_URL` = رابط Vercel الفعلي**
  - مثال: `https://syba-community.vercel.app`

- [ ] **تسجيل دخول الأدمن**
  - افتح `https://[your-app].vercel.app/login`
  - بيانات المشرف (لا تُكشف هنا — انظر .env.example)
  - **غيّر كلمة المرور فوراً** (في الإنتاج الحقيقي)

- [ ] **تفعيل 2FA للمشرف العام**
  - `/admin/settings/security`
  - اضغط "تفعيل 2FA"
  - امسح QR بـGoogle Authenticator
  - أدخل رمز 6 أرقام
  - احفظ 10 backup codes في مدير كلمات مرور
  - اضغط "تمّ — إنهاء التهيئة"

- [ ] **تفعيل IP allowlist** (اختياري للأمان العالي)
  - `/admin/settings/security/ips`
  - اضغط "أضف IP الحالي" + "إضافة"
  - فعّل Toggle "تفعيل قائمة IP"
  - ⚠️ تأكّد من إضافة IPك قبل التفعيل

### قاعدة البيانات

- [ ] **Supabase project مُنشأ** (Region: Frankfurt)
- [ ] **`DATABASE_URL`** = Supabase Pooler (مع `?pgbouncer=true`)
- [ ] **`DIRECT_URL`** = Supabase Direct connection
- [ ] **الترحيل نُفّذ**: `bash scripts/migrate-to-supabase.sh`
- [ ] **الـseed شُغّل**: 200 مستخدم + 50 عائلة + 300 مساهمة في DB
- [ ] **تحقّق من Supabase Dashboard**: Table Editor → User → 200+ صف

### الاختبار الوظيفي

- [ ] **فتح الصفحة الرئيسية** `/` → تظهر Hero + إحصاءات حية
- [ ] **تسجيل دخول العضو** → `/community`
- [ ] **إنشاء مساهمة** (20 درهم) → DB: مساهمة جديدة + PENDING
- [ ] **إنشاء طلب صرف** (500 د.م) → DB: SY-XXX، requiresEthics=false
- [ ] **تسجيل في فعالية** → QR code يظهر
- [ ] **لوحة الأدمن** → `/admin` → 16 قسم مرئي
- [ ] **أمين الصندوق يوافق على طلب < 1000**:
  - `/admin/fund` → "طلبات الصرف" → "بدء المراجعة" → "موافقة" → "تسجيل الصرف" → "إغلاق"
  - DB: status=COMPLETED

---

## 📅 الإعداد الأسبوعي

### المراقبة

- [ ] **مراجعة Audit Log**: `/admin/audit` — راجع آخر 50 نشاطاً
- [ ] **مراجعة النسخ الاحتياطي**: `/admin/backup`
  - حمّل نسخة JSON كاملة (أسبوعياً)
  - احفظها في مكان آمن (Google Drive / Dropbox)
- [ ] **مراجعة Vercel Analytics**: 
  - Vercel → Project → Analytics
  - راجع Page Views + Web Vitals
- [ ] **مراجعة Supabase usage**:
  - Supabase → Project → Settings → Usage
  - تحقّق من حدود الـFree tier (500MB DB, 5GB egress)

### المحتوى

- [ ] **مراجعة الشكاوى المفتوحة**: `/admin/complaints` → Filter: OPEN
- [ ] **تحديث المحتوى** (إن لزم):
  - الأخبار
  - الفعاليات القادمة
  - إعلانات البانرات
- [ ] **مراجعة الإعلانات المعلّقة**: `/admin/ads` → Filter: PENDING
  - وافق أو ارفض الإعلانات الجديدة

### الأداء

- [ ] **قياس Web Vitals**: `bun run scripts/measure-vitals.ts` (محلياً)
- [ ] **مراجعة Lighthouse** عبر [PageSpeed Insights](https://pagespeed.web.dev)
  - قِس `/`, `/community/fund`, `/admin`
  - الهدف: Performance ≥ 85, Accessibility ≥ 90

---

## 📆 الإعداد الشهري

### التقارير

- [ ] **تقرير مالي شهري**: `/admin/reports` → تبويب "مالي" → تنزيل PDF
- [ ] **تقرير النشاط**: `/admin/reports` → تبويب "نشاط" → تنزيل CSV
- [ ] **تقرير النمو**: `/admin/reports` → تبويب "نمو"
  - قارن بالنمو السابق
  - سجّل الأرقام في ملف Excel

### المراجعة الأمنية

- [ ] **مراجعة آخر 10 محاولات دخول فاشلة**: `/admin/audit` → Filter: severity=warning
- [ ] **مراجعة 2FA** للمشرفين: تأكّد أن كل SUPER_ADMIN مُفعّل لديه 2FA
- [ ] **تدوير NEXTAUTH_SECRET** (كل 3 أشهر للإنتاج الحسّاس)
- [ ] **مراجعة IP allowlist**: تحقّق من IPs المُدرجة، أزل القديمة

### النسخ الاحتياطي

- [ ] **نسخة كاملة**: `/admin/backup` → "تنزيل JSON كامل"
- [ ] **تحقّق من استعادة الاختبار**:
  - حمّل نسخة JSON
  - استوردها في بيئة Dev محلية
  - تحقّق من البيانات
- [ ] **إعداد Supabase Backups**:
  - Supabase → Project → Database → Backups
  - فعّل "Daily backups" (مجاني، يحتفظ بـ7 نسخ)

---

## 📈 مؤشرات النجاح (للترقية للمدفوع)

### متى تُرقّي؟
- ✅ 500 أسرة مسجّلة على الأقل
- ✅ 100 مساهمة شهرية منتظمة
- ✅ 10 فعاليات منظمة
- ✅ نمو 20% شهرياً لمدة 3 أشهر

### خطة الترقية

#### الخطوة 1 (~200 د.م/شهر = $20)
- Vercel Pro: إزالة خمول 15 دقيقة
- يُفعّل عبر Vercel → Project → Billing → Upgrade

#### الخطوة 2 (~250 د.م/شهر = $25)
- Supabase Pro: 8GB DB (بدل 500MB) + Point-in-time recovery
- يُفعّل عبر Supabase → Project → Settings → Billing

#### الخطوة 3 (~300-500 د.م/شهر)
- VPS مغربي محلي (Hetzner أو مزوّد مغربي)
- راجع `DEPLOYMENT.md` لخطوات الترحيل

---

## 🚨 خطة الطوارئ

### انهيار قاعدة البيانات
1. Supabase → Project → Database → Backups → Restore
2. اختار آخر نسخة احتياطية ناجحة
3. انتظر الاستعادة (5-15 دقيقة)
4. تحقّق من `/admin` بعد الاستعادة

### انهيار Vercel
1. راجع [status.vercel.com](https://status.vercel.com)
2. إن مشكلة عامة: انتظر
3. إن مشكلة خاصة: Vercel → Project → Deployments → Redeploy

### اختراق أمني مشتبه به
1. **فوراً**: غيّر NEXTAUTH_SECRET في Vercel
2. **فوراً**: عطّل IP allowlist (للسماح لنفسك)
3. **فوراً**: عطّل 2FA مؤقتاً (إن كنت محظوراً)
4. **خلال ساعة**: راجع `/admin/audit` لآخر 100 نشاط
5. **خلال ساعة**: عطّل الحسابات المشتبه بها
6. **خلال يوم**: أنشئ NEXTAUTH_SECRET جديد + أعد النشر

### فقدان بيانات
1. حمّل آخر نسخة JSON من `/admin/backup` (إن كان متاحاً)
2. أو حمّل من Supabase Dashboard → Backups
3. استخدم `/admin/backup/restore` للاستعادة

---

## 📞 جهات اتصال الطوارئ

- **Supabase Support**: [supabase.com/help](https://supabase.com/help)
- **Vercel Support**: [vercel.com/help](https://vercel.com/help)
- **Brevo Support**: [help.brevo.com](https://help.brevo.com)
- **Google PageSpeed**: [pagespeed.web.dev](https://pagespeed.web.dev)

---

## ✅ Checklist الإطلاق النهائي

قبل إعلان الإطلاق رسمياً، تأكّد من:

- [ ] `DEMO_MODE=false` في Vercel
- [ ] `NEXTAUTH_SECRET` جديد (32-byte hex)
- [ ] `NEXTAUTH_URL` = رابط Vercel
- [ ] `DATABASE_URL` + `DIRECT_URL` = Supabase
- [ ] 200 مستخدم + 50 عائلة في DB (Supabase)
- [ ] 2FA مُفعّل للمشرف العام
- [ ] IP allowlist مُفعّل (اختياري)
- [ ] SMTP مُضبط (Brevo) — أو معطّل مؤقتاً
- [ ] `/` يعمل → إحصاءات حية
- [ ] `/login` يعمل → login admin
- [ ] `/admin` → 16 قسم مرئي
- [ ] `/community/fund` → 3 تبويبات تعمل
- [ ] نسخة احتياطية JSON محفوظة

---

**"إنّ الله في عون العبد ما دام العبد في عون أخيه"**

**© 2026 سيدي يوسف بن علي العاصمة. من حي إلى عاصمة.**
