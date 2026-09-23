# دليل النشر — سيدي يوسف بن علي العاصمة

> من حي إلى عاصمة... المعروف الرقمي — النشر المجاني ثم الترقية للمدفوع

---

## ⚠️ تحذيرات صارمة قبل النشر

1. **`DEMO_MODE=false`** — إلزامي! صفحة `/demo-access` تُفعّل تلقائياً بـ`DEMO_MODE=true` وتُعرض كل حسابات التجربة + روابط دخول سريع. في الإنتاج **خطر أمني حرج**. اضبط `DEMO_MODE=false` في Vercel Environment Variables.

2. **`NEXTAUTH_SECRET` جديد** — لا تستخدم قيمة الـdev. ولّد جديدة:
   ```bash
   openssl rand -hex 32
   ```

3. **`SMTP_ENABLED=false`** افتراضياً — فعّله فقط بعد إضافة بيانات Brevo.

4. **2FA للمشرف العام** — فعّله فور أول login عبر `/admin/settings/security`.

5. **IP allowlist** — فعّله عبر `/admin/settings/security/ips` بعد إضافة IPك.

---

## 🚀 المرحلة 1: النشر المجاني (Vercel + Supabase)

### الخطوة 1: GitHub
```bash
git init
git add .
git commit -m "v1.0.0 — Launch: سيدي يوسف بن علي العاصمة"
git branch -M main
git remote add origin https://github.com/<user>/syba-community.git
git push -u origin main
```

### الخطوة 2: Supabase (قاعدة بيانات PostgreSQL مجانية)
1. اذهب إلى [supabase.com](https://supabase.com) → سجّل حساباً مجانياً
2. **New Project** → اختر:
   - Name: `syba-community`
   - Database Password: كلمة مرور قوية (احفظها!)
   - Region: **Frankfurt** (أقرب للمغرب)
3. انتظر 2-3 دقائق حتى جاهزية المشروع
4. من **Settings → Database → Connection string**:
   - **Pooler mode (موصى به)**: `postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
   - **Direct mode (لـmigrations)**: `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`

### الخطوة 3: تحديث الـSchema لـPostgreSQL
عدّل `prisma/schema.prisma`:
```prisma
datasource db {
  provider  = "postgresql"  // ← غيّر من sqlite
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

ثم رحّل الـschema:
```bash
# محلياً مع DIRECT_URL
DATABASE_URL="postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres" \
  bun run db:push

# شغّل الـseed
DATABASE_URL="postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres" \
  bun run db:seed
```

تحقق من Supabase Dashboard → Table Editor → User → يجب أن ترى 200+ صف.

### الخطوة 4: Vercel
1. [vercel.com](https://vercel.com) → سجّل بحساب GitHub
2. **New Project** → Import المستودع
3. **Configure**:
   - Framework: Next.js (auto-detected)
   - Build Command: `prisma generate && next build`
   - Install Command: `bun install` (أو `npm install`)
4. **Environment Variables** (مهم جداً):

| المتغيّر | القيمة |
|---------|--------|
| `DATABASE_URL` | Pooler connection (مع `?pgbouncer=true`) |
| `DIRECT_URL` | Direct connection (بدون pooling) |
| `NEXTAUTH_SECRET` | ولّد جديدة: `openssl rand -hex 32` — **لا تُكشفها في أي تقرير أو commit** |
| `NEXTAUTH_URL` | `https://<project>.vercel.app` |
| `DEMO_MODE` | `false` ⚠️ إلزامي |
| `SETUP_KEY` | ولّد جديدة: `openssl rand -hex 16` — لـ/api/setup/seed فقط، احذفها بعد الاستخدام |
| `SMTP_HOST` | `smtp-relay.brevo.com` (لاحقاً) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | (بريد Brevo) |
| `SMTP_PASS` | (مفتاح Brevo SMTP) |
| `SMTP_FROM` | `"سيدي يوسف بن علي العاصمة <noreply@syba-community.ma>"` |
| `SMTP_ENABLED` | `false` (افتراضي) — فعّله بعد إضافة Brevo |

5. **Deploy** — انتظر 2-3 دقائق
6. الرابط النهائي: `https://<project>.vercel.app`

### الخطوة 5: اختبار ما بعد النشر
```bash
# افتح الرابط في المتصفّح
# 1. / يجب أن تظهر الصفحة الرئيسية
# 2. /login → سجّل دخول (لا تُكشف بيانات الاعتماد في صفحات الإنتاج)
# 3. /admin → 16 قسم
# 4. /community → لوحة المجتمع
# 5. /community/fund → صندوق المعروف (3 تبويبات)
```

---

## 🔒 الأمان — قواعد صارمة

### ⚠️ تحذيرات حرجة

1. **لا تُكشف `NEXTAUTH_SECRET` في أي تقرير، commit، لقطة، أو رسالة.** أي شخص يملكه يمكنه تزوير جلسات المشرفين.
   - ولّد جديدة: `openssl rand -hex 32`
   - ضعها في Vercel Environment Variables كـ`Secret` type
   - لا تضعها في `.env.example` أو أي ملف يُرفع لـGit

2. **`SETUP_KEY` مستقل عن `NEXTAUTH_SECRET`** — استخدمه فقط لـ`/api/setup/seed` مرة واحدة، ثم احذفه من Vercel.

3. **`DEMO_MODE=false` إلزامي للإنتاج** — يحمي `/demo-access` (تُعطّل الصفحة وتعود 404).

4. **بيانات الاعتماد التجريبية (بيانات الاعتماد التجريبية)** — تُستخدم فقط في وضع DEMO. للإنتاج:
   - غيّر كلمة مرور المشرف العام فور أول login
   - أنشئ حسابات حقيقية للمشرفين
   - فعّل 2FA لكل SUPER_ADMIN

5. **بعد الإطلاق، احذف `/api/setup/seed` من الكود** — لأنه يفتح باب تشغيل الـseed.

6. **`/api/health` آمن** — لا يكشف credentials، فقط hostname + عدد البيانات.

### فحص أمني دوري
- شهرياً: راجع Vercel env vars واحذف القديمة
- شهرياً: دور `NEXTAUTH_SECRET` كل 3 أشهر
- فوراً عند أي اشتباه: غيّر `NEXTAUTH_SECRET` + أعد النشر

---

## 📧 البريد الإنتاجي (Brevo)

### لماذا Brevo؟
- مجاني: 300 بريد/يوم
- SMTP قياسي (Port 587 + STARTTLS)
- دعم عربي كامل (UTF-8)

### الإعداد
1. سجّل في [brevo.com](https://brevo.com)
2. اذهب إلى **SMTP & API → SMTP**
3. احصل على:
   - SMTP User: بريك الإعداد
   - SMTP Pass: مفتاح SMTP (ولّد واحد جديد)
4. أضف في Vercel Environment Variables:
   ```
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=<your-brevo-smtp-user>
   SMTP_PASS=<your-brevo-smtp-key>
   SMTP_FROM="سيدي يوسف بن علي العاصمة <noreply@syba-community.ma>"
   SMTP_ENABLED=true
   ```
5. أعد النشر (Vercel → Redeploy)
6. اختبر: `/admin/settings/email` → "اختبار الإرسال"

### القوالب الـ7 المُدمجة
- ترحيب بعد التسجيل
- إيصال مساهمة
- تحديث حالة طلب
- تذكرة فعالية + QR
- إعادة تعيين كلمة مرور
- إشعار عام
- اختبار الإعدادات

---

## 🔐 2FA للمشرف العام

1. سجّل دخول ببيانات المشرف (انظر .env.example)
2. اذهب لـ`/admin/settings/security`
3. اضغط "تفعيل 2FA"
4. امسح QR بـGoogle Authenticator (أو Authy)
5. أدخل رمز 6 أرقام
6. احفظ 10 backup codes في مدير كلمات مرور
7. اضغط "تمّ — إنهاء التهيئة"

بعد التفعيل: كل login يتطلّب رمز TOTP + كلمة المرور.

---

## 🌐 IP Allowlist

1. سجّل دخول كأدمن
2. `/admin/settings/security/ips`
3. اضغط "أضف IP الحالي" (يكتشف IPك تلقائياً)
4. اضغط "إضافة"
5. فعّل Toggle "تفعيل قائمة IP"
6. الآن فقط IPs المُدرجة يمكنها الوصول للمنصة

⚠️ تأكّد من إضافة IPك قبل التفعيل، وإلا تُحظر نفسك.

---

## 📈 خطة الترقية لـVPS

### متى تُرقّي؟
- 500 أسرة مسجّلة
- 100 مساهمة شهرية منتظمة
- 10 فعاليات منظمة
- نمو 20% شهرياً لمدة 3 أشهر

### الخيار 1: Vercel Pro (~200 د.م/شهر)
- إزالة خمول 15 دقيقة
- Edge Functions
- Web Analytics مفصّلة

### الخيار 2: Supabase Pro (~250 د.م/شهر = $25)
- 8GB قاعدة بيانات (بدل 500MB)
- Point-in-time recovery
- Backups متقدمة

### الخيار 3: VPS مغربي (200-500 د.م/شهر) — الموصى به على المدى الطويل

#### Hetzner Cloud (أرخص)
| الخطة | RAM | Storage | السعر |
|------|-----|---------|------|
| CX22 | 4GB | 40GB SSD | ~€4.5 (45 د.م) |
| CX32 | 8GB | 80GB SSD | ~€7.5 (75 د.م) |

#### مزوّدون مغاربة
- [Hebermar](https://www.hebermar.com): من 250 د.م/شهر
- [Hébergement.ma](https://www.hebergement.ma): من 200 د.م/شهر
- [AfricaServer](https://africaserver.com): من 350 د.م/شهر

#### خطوات الترحيل لـVPS
```bash
# 1. أعدّ Ubuntu 22.04 LTS
apt update && apt upgrade -y
apt install -y nodejs npm postgresql nginx certbot python3-certbot-nginx git
curl -fsSL https://bun.sh/install | bash

# 2. أنشئ قاعدة بيانات
sudo -u postgres createuser -P syba
sudo -u postgres createdb -O syba syba_community

# 3. استنسخ
cd /var/www
git clone https://github.com/<user>/syba-community.git
cd syba-community && bun install

# 4. البيئة
cp .env.example .env  # اضبط القيم
DATABASE_URL="postgresql://syba:password@localhost:5432/syba_community"

# 5. اضبط DB
bun run db:push && bun run db:seed

# 6. ابنِ
bun run build

# 7. PM2 (مدير عمليات)
npm install -g pm2
pm2 start "bun .next/standalone/server.js" --name syba-community
pm2 save && pm2 startup

# 8. Nginx proxy
sudo nano /etc/nginx/sites-available/syba-community
server {
    listen 80;
    server_name syba-community.ma www.syba-community.ma;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
sudo ln -s /etc/nginx/sites-available/syba-community /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 9. SSL
sudo certbot --nginx -d syba-community.ma -d www.syba-community.ma
```

### الترحيل من Supabase لـVPS PostgreSQL
```bash
# على Supabase
pg_dump "postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres" \
  -F c -f supabase-backup.dump

# على VPS
pg_restore -h localhost -U syba -d syba_community supabase-backup.dump
```

---

## 💰 التكلفة الشهرية المتوقّعة

| المرحلة | المنصة | التكلفة |
|---------|--------|--------|
| MVP (شهر 1-6) | Vercel Hobby + Supabase Free | **0 د.م** |
| نمو (شهر 7-9) | Vercel Pro + Supabase Free | ~200 د.م |
| توسّع (شهر 10-12) | Vercel Pro + Supabase Pro | ~450 د.م |
| سنة 2+ | VPS مغربي + Domain .ma | ~300-500 د.م |

---

## 🆘 استكشاف الأخطاء

### `Can't reach database server`
- تحقّق من `DATABASE_URL` (يجب أن يحوي `?pgbouncer=true` لـSupabase pooler)
- المنفذ 6543 للـpooler، 5432 للـdirect

### `PrismaClientInitializationError`
```bash
vercel --prod  # أعد النشر بعد إعادة توليد Prisma
```

### `Hydration mismatch`
- تأكّد من `<html lang="ar" dir="rtl" suppressHydrationWarning>`
- `ThemeProvider` بـ`suppressHydrationWarning`

### `Unauthorized` في API
- `NEXTAUTH_SECRET` مضبوط
- `NEXTAUTH_URL` = رابط Vercel الفعلي

### بريد لا يصل
- تحقّق من `SMTP_ENABLED=true`
- تحقّق من بيانات Brevo في `/admin/settings/email`
- راجع `EmailLog` في `/admin/settings/email/logs`

---

## 📚 موارد إضافية

- [Next.js 16 Docs](https://nextjs.org/docs)
- [Prisma + PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Hobby Limits](https://vercel.com/docs/limits/usage)
- [Brevo SMTP](https://developers.brevo.com/docs/getting-started-send-your-first-email)

---

## 📋 CNDP Compliance (القانون 09-08)

### الإخطار الإلزامي
قبل الإطلاق الرسمي، يجب إخطار CNDP (اللجنة الوطنية لمراقبة حماية البيانات الشخصية):

1. اذهب إلى [https://www.cnp.ma](https://www.cnp.ma)
2. أنشئ حساب «مسؤول معالجة» (Responsable de traitement)
3. أرسل إخطار المعالجة (نموذج إقرار) موضّحاً:
   - هوية مسؤول المعالجة (لجنة الحيّ)
   - الغرض من المعالجة (إدارة صندوق تضامني رقمي)
   - البيانات المُعالَجة (انظر القائمة أدناه)
   - مدة الاحتفاظ (5 سنوات للبيانات المالية)
   - تدابير الأمن (bcrypt, HTTPS, AuditLog)
   - نقل البيانات الدولي (Supabase EU)
4. انتظر الموافقة (عادةً 1-4 أسابيع)
5. أضف رقم الإخطار في Footer — استبدل النص المؤقّت بنفس الرقم الرسمي

> حتى الحصول على الموافقة، يمكن نشر المنصة في وضع تجريبي (DEMO_MODE=true)
> دون جمع بيانات حقيقية، أو بدعوة مغلقة (Beta).

### البيانات المُعالَجة
- الاسم الكامل، البريد الإلكتروني، الهاتف
- رقم البطاقة الوطنية (اختياري، مُشفّر بـ bcrypt)
- بيانات المساهمات والطلبات (المبلغ، الشهر، الطريقة، الإيصال)
- سجل النشاط (AuditLog) — IP + User-Agent + الإجراء + التاريخ
- تفضيلات الإشعارات + الإشعارات الداخلية

### التخزين
- **Supabase PostgreSQL (EU — Frankfurt/London)** — لا تخرج البيانات من الاتحاد الأوروبي
- **مشفّر في الراحة (at rest)** — AES-256 (افتراضي في Supabase)
- **مشفّر في النقل (in transit)** — TLS 1.3 / HTTPS
- **نسخ احتياطية يومية مشفّرة** — تُحفظ في منطقة Supabase الأوروبية

### حقوق الأشخاص الذاتيين (وفق المادة 7-9)
المنصة تطبّق الحقوق التالية عبر `privacy@syba-community.ma`:
- حق الوصول — نسخة JSON من بياناتك خلال 30 يوماً
- حق التصحيح — من ملف العضو أو عبر البريد
- حق الحذف — «حق النسيان» (يحترم الالتزام بـ 5 سنوات مالية)
- حق نقل البيانات — JSON قابل للقراءة آلياً
- حق الاعتراض — على معالجة معيّنة
- حق سحب الموافقة — في أي وقت

### سجلّ خرق البيانات (Data Breach)
عند اكتشاف خرق جوهري:
1. إخطار CNDP خلال **72 ساعة** (المادة 17 من القانون 09-08)
2. إخطار الأشخاص المتأثّرين خلال 72 ساعة إضافية
3. توثيق الحادث في AuditLog + تقرير مفصّل للأمين العام للّجنة
4. تنفيذ إجراءات تصحيحية (إعادة تعيين كلمات المرور، تدوير NEXTAUTH_SECRET، إلخ)

### المكوّنات في المنصة
- `/privacy-policy` — السياسة الكاملة (عربي + فرنسي)
- `/terms` — شروط الاستخدام (12 قسماً)
- `/contact` — نموذج اتصال (يُحفظ في `Complaint` أو `Notification`)
- `CookieConsent` — بانر الموافقة على الكوكيز (3 خيارات + تخصيص)
- `AuditLog` — سجل تدقيق كامل لكل عملية حسّاسة
- `site-footer.tsx` — إشارة CNDP في كل صفحة عامة

### روابط قانونية مفيدة
- [CNDP — الموقع الرسمي](https://www.cnp.ma)
- [القانون 09-08 — النص الكامل](https://www.cnp.ma/Loi_09-08_Ar.pdf)
- [GDPR Equivalence — EU/MA Comparison](https://edpb.europa.eu/)

---

**© 2026 سيدي يوسف بن علي العاصمة. من حي إلى عاصمة.**
