# دليل النشر المجاني — سيدي يوسف بن علي العاصمة

> من حي إلى عاصمة... المعروف الرقمي — نشر مجاني 100% ثم ترقية للمدفوع بعد النجاح

---

## 🎯 الاستراتيجية العامة

| المرحلة | المنصة | التكلفة الشهرية | السبب |
|---------|--------|-----------------|------|
| الشهر 1-6 (MVP) | Vercel Hobby + Supabase Free | **0 درهم** | إثبات الفكرة |
| الشهر 7-9 (نمو) | Vercel Pro + Supabase Free | ~$20 (200 د.م) | إزالة خمول الخادم |
| الشهر 10-12 (توسّع) | Render Starter + Supabase Pro | ~$32 (320 د.م) | مساحة + أداء |
| السنة 2+ | VPS محلي مغربي | 200-500 د.م | استضافة محلية، دعم |

---

## ✅ مؤشرات النجاح للترقية (مطلوب تحقيقها قبل الترقية)

- [ ] 500 أسرة مسجّلة على الأقل
- [ ] 100 مساهمة شهرية في صندوق المعروف
- [ ] 10 فعاليات منظمة
- [ ] 50 إعلان في السوق المحلي (مؤجّل للمرحلة الثانية)
- [ ] نمو 20% شهرياً لمدة 3 أشهر

---

## 🚀 المرحلة 1: النشر المجاني الكامل (0 درهم)

### المعمارية

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Vercel Hobby    │ ←→  │  Supabase Free   │     │  GitHub (repo)   │
│  (Next.js)       │     │  (PostgreSQL)    │     │  (مصدر + CI/CD)  │
│                  │     │                  │     │                  │
│  - 100GB BW      │     │  - 500MB DB      │     │  - Public/Private│
│  - Serverless    │     │  - 50K users     │     │  - Pages + Actions│
│  - Automatic SSL │     │  - 5GB egress    │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### الخطوة 1: إعداد Supabase (قاعدة البيانات)

1. اذهب إلى [supabase.com](https://supabase.com) → سجّل حساباً مجانياً
2. أنشئ Organization → أنشئ Project (اختر المنطقة Frankfurt لأقربها للمغرب)
3. اضبط كلمة مرور قوية لقاعدة البيانات
4. من Settings → Database → احصل على Connection string:
   - **Connection pooling** (Supavisor): `postgresql://postgres.[ref]:[password]@aws-0-frankfurt.pooler.supabase.com:6543/postgres?pgbouncer=true`
   - **Direct connection**: `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`
5. من Settings → API → احصل على `service_role` key (للـseed)

### الخطوة 2: إعداد المستودع على GitHub

```bash
# محلياً
cd syba-community
git init
git add .
git commit -m "v1.0.0 — منصة المعروف الرقمي"
git branch -M main
git remote add origin https://github.com/[user]/syba-community.git
git push -u origin main
```

### الخطوة 3: النشر على Vercel

1. اذهب إلى [vercel.com](https://vercel.com) → سجّل بحساب GitHub
2. **Import Project** → اختر المستودع
3. **Configure Project**:
   - Framework Preset: Next.js
   - Build Command: `next build` (الافتراضي)
   - Output Directory: `.next` (الافتراضي)
   - Install Command: `bun install` (أو `npm install`)
4. **Environment Variables** (مهم جداً):

| المتغيّر | القيمة | ملاحظة |
|---------|--------|--------|
| `DATABASE_URL` | `postgresql://postgres.[ref]:[pass]@aws-0-frankfurt.pooler.supabase.com:6543/postgres?pgbouncer=true` | Supabase pooler |
| `DIRECT_URL` | `postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres` | لـmigrate (دون pooling) |
| `NEXTAUTH_SECRET` | (32-byte random hex) | `openssl rand -hex 32` |
| `NEXTAUTH_URL` | `https://[project].vercel.app` | رابط Vercel |
| `SHADOW_DATABASE_URL` | (نفس DIRECT_URL) | لـpreview branches |

5. **Deploy** — انتظر 2-3 دقائق
6. بعد النشر الناجح، اذهب إلى **Functions** → تأكّد من عمل `/api/auth/[...nextauth]`

### الخطوة 4: تهيئة Prisma لـSupabase

عدّل `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"  // تغيير من sqlite إلى postgresql
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // لـmigrations
}

// كل الـbytes/@db.Binary تكفي لأن Prisma يُترجم تلقائياً
```

ثم:

```bash
# محلياً (مع DATABASE_URL=direct connection)
bun run db:migrate --name init
bun run db:seed
```

### الخطوة 5: ضبط Domain مخصّص (اختياري)

- Vercel → Project → Settings → Domains
- أضف `syba-community.ma` (أو ما تملكه)
- أضف `www.syba-community.ma`
- اتبع تعليمات DNS (A record أو CNAME)
- Let's Encrypt SSL يُولّد تلقائياً

### الخطوة 6: إضافة Google AdSense (اختياري)

1. [adsense.google.com](https://adsense.google.com) → سجّل موقعك
2. انتظر الموافقة (3-14 يوم)
3. بعد الموافقة، أضف `<script>` في `src/app/layout.tsx`:

```tsx
<Script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
  crossOrigin="anonymous"
  strategy="afterInteractive"
/>
```

⚠️ Vercel Hobby تمنع الاستخدام التجاري — تجنّب تحصيل اشتراكات أو إعلانات مدفوعة مباشرة.

---

## 🔧 خطوات ما بعد النشر

### اختبار التشغيل

```bash
# استعلم عن الصحة
curl https://[project].vercel.app/api/auth/session
# يجب أن يرجع null (لا جلسة)

# جرّب الـlogin عبر الـweb UI
# بحساب admin@syba-community.ma / Demo@1234
# (غيّر كلمة المرور فوراً في الإنتاج!)
```

### تفعيل النسخ الاحتياطي

1. **Supabase Dashboard** → Project → Database → Backups
2. فعّل "Daily backups" (مجاني، يحتفظ بـ7 نسخ)
3. فعّل "Point-in-time recovery" (يتطلّب Pro — لاحقاً)
4. نسخ احتياطي يدوي إضافي:
   ```bash
   # محلياً، لتصدير المخطط + البيانات
   pg_dump "postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres" -F c -f backup-$(date +%Y%m%d).dump
   ```

### ضبط الأمان

1. **غيّر كلمة مرور قاعدة البيانات** في Supabase
2. **أعد توليد NEXTAUTH_SECRET**:
   ```bash
   openssl rand -hex 32
   ```
3. **احذف الحسابات التجريبية** بعد اختبار الإنتاج:
   ```ts
   // script: scripts/cleanup-demo-users.ts
   await db.user.deleteMany({ where: { email: { contains: "@syba-community.ma" } } });
   ```
4. **فعّل 2FA** على حساب Supabase وVercel
5. **قائمة IP مسموح** في Supabase (Settings → Database → Network restrictions)

### المراقبة

- **Vercel Analytics**: مجاني لمشاريع Hobby (page views، Web Vitals)
- **Supabase Logs**: مجاني (real-time + 7-day retention)
- **UptimeRobot**: مجاني 50 monitor (تحقّق من الصحة كل 5 دقائق)

---

## 📈 المرحلة 2: الترقية للنمو (الشهر 7-9)

### متى تُرقّي؟

- ❌ Vercel Hobby يتجمّد بعد 15 دقيقة خمول
- ❌ Supabase Free يوقف المشروع بعد أسبوع خمول
- ✅ تجاوزت 200 أسرة مسجّلة + 50 مساهمة شهرية

### الترقية (Render Starter)

| المكوّن | الـPlan | السعر |
|--------|---------|------|
| Vercel Pro | Pro | $20/شهر |
| Supabase Free | (يبقى مجاني) | $0 |
| **الإجمالي** | | **~$20 (200 د.م)** |

### الخطوات

1. Vercel → Project → Settings → Billing → ترقية إلى Pro
2. فعّل "Always On" (لا تجميد بعد خمول)
3. فعّل "Edge Functions" (اختياري، للأداء)

---

## 🏗️ المرحلة 3: التوسّع (الشهر 10-12)

### متى تُرقّي؟

- ✅ تجاوزت 500 أسرة مسجّلة
- ✅ 100 مساهمة شهرية منتظمة
- ✅ تحتاج مساحة أكبر من 500MB

### الترقية لـSupabase Pro

- $25/شهر → 8GB قاعدة بيانات
- Point-in-time recovery
- أوتوماتيك backups متقدمة

### أو الترحيل لـVPS (أرخص على المدى الطويل)

#### Hetzner Cloud (موصى به — أرخص وأسرع)

| الخطة | RAM | Storage | السعر |
|------|-----|---------|------|
| CX22 | 4GB | 40GB SSD | ~€4.5 (45 د.م) |
| CX32 | 8GB | 80GB SSD | ~€7.5 (75 د.م) |
| CX42 | 16GB | 160GB SSD | ~€15 (150 د.م) |

#### Contabo (بديل)

| الخطة | RAM | Storage | السعر |
|------|-----|---------|------|
| VPS S | 4GB | 50GB NVMe | ~€4 (40 د.م) |
| VPS M | 8GB | 100GB NVMe | ~€6 (60 د.م) |

#### خطوات الترحيل لـVPS

```bash
# 1. أعدّ VPS بنظام Ubuntu 22.04 LTS
# 2. ثبّت الحزم
apt update && apt upgrade -y
apt install -y nodejs npm postgresql nginx certbot python3-certbot-nginx git
curl -fsSL https://bun.sh/install | bash

# 3. أنشئ قاعدة بيانات PostgreSQL
sudo -u postgres createuser -P syba
sudo -u postgres createdb -O syba syba_community

# 4. استنسخ المستودع
cd /var/www
git clone https://github.com/[user]/syba-community.git
cd syba-community
bun install

# 5. اضبط البيئة
cp .env.production .env
# عدّل DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

# 6. اضبط قاعدة البيانات
bun run db:migrate --name init
bun run db:seed

# 7. ابنِ التطبيق
bun run build

# 8. شغّل بـPM2 (مدير عمليات)
npm install -g pm2
pm2 start "bun .next/standalone/server.js" --name syba-community
pm2 save
pm2 startup

# 9. اضبط Nginx كـproxy عكسي
# /etc/nginx/sites-available/syba-community
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

# 10. فعّل SSL
sudo ln -s /etc/nginx/sites-available/syba-community /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d syba-community.ma -d www.syba-community.ma

# 11. اضبط جدار ناري
ufw allow 22/tcp 80/tcp 443/tcp
ufw enable
```

#### الترحيل من Supabase لـVPS PostgreSQL

```bash
# من Supabase Dashboard: Database → Backup → Download
pg_restore -h localhost -U syba -d syba_community backup.dump

# أو استخدم pg_dump مباشرة
pg_dump "postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres" \
  -F c -f supabase-backup.dump

pg_restore -h localhost -U syba -d syba_community supabase-backup.dump
```

---

## 🇲🇦 المرحلة 4: الاستضافة المحلية المغربية (السنة 2+)

### مزوّدون مغاربة محليون

| المزوّد | الخدمة | السعر التقريبية |
|--------|------|------------------|
| [Hebermar](https://www.hebermar.com) | VPS مغربي | من 250 د.م/شهر |
| [Servermaroc](https://servermaroc.com) | VPS + cPanel | من 300 د.م/شهر |
| [Hébergement.ma](https://www.hebergement.ma) | VPS + استضافة مشتركة | من 200 د.م/شهر |
| [AfricaServer](https://africaserver.com) | VPS في الدار البيضاء | من 350 د.م/شهر |

### فوائد الاستضافة المحلية

- ✅ زمن استجابة أقل للمستخدمين المغاربة
- ✅ دعم بالعربية/الفرنسية
- ✅ دفع بـCMI (بالدرهم)
- ✅ احترام القانون المغربي لحماية البيانات

---

## 🔐 الأمان في الإنتاج

### قائمة التحقّق

- [ ] تغيير كلمات مرور الحسابات التجريبية
- [ ] توليد NEXTAUTH_SECRET جديد (32 bytes)
- [ ] تفعيل 2FA على Supabase + Vercel + GitHub
- [ ] ضبط قائمة IP المسموح في Supabase
- [ ] إضافة `Content-Security-Policy` في headers
- [ ] تفعيل Rate Limiting على `/api/auth/*`
- [ ] نسخ احتياطي يومي + أسبوعي + شهري
- [ ] مراقبة uptime (UptimeRobot)
- [ ] اختبار اختراق كل 6 أشهر

### Headers مطلوبة (next.config.ts)

```ts
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

module.exports = {
  async headers() {
    return [{
      source: '/(.*)',
      headers: securityHeaders,
    }];
  },
};
```

---

## 💰 التكلفة الشهرية المتوقّعة

### المرحلة 1 (الشهر 1-6): **0 درهم**

| الخدمة | الباقة | التكلفة |
|--------|------|--------|
| Vercel | Hobby | 0 د.م |
| Supabase | Free | 0 د.م |
| GitHub | Public | 0 د.م |
| UptimeRobot | Free | 0 د.م |
| Cloudflare DNS | Free | 0 د.م |
| Let's Encrypt SSL | Free | 0 د.م |
| **الإجمالي** | | **0 د.م** |

### المرحلة 2 (الشهر 7-9): **~200 درهم**

| الخدمة | الباقة | التكلفة |
|--------|------|--------|
| Vercel | Pro | ~200 د.م ($20) |
| Supabase | Free | 0 د.م |
| **الإجمالي** | | **200 د.م** |

### المرحلة 3 (الشهر 10-12): **~320 درهم**

| الخدمة | الباقة | التكلفة |
|--------|------|--------|
| Vercel | Pro | ~200 د.م |
| Supabase | Pro | ~250 د.م ($25) |
| **الإجمالي** | | **450 د.م** |

### المرحلة 4 (السنة 2+): **200-500 درهم**

| الخدمة | الباقة | التكلفة |
|--------|------|--------|
| VPS مغربي محلي | 4GB/40GB | 250-400 د.م |
| Domain .ma | سنوي | ~250 د.م/سنة (20 د.م/شهر) |
| Backup service | إضافي | 50 د.م |
| **الإجمالي** | | **~300-500 د.م** |

---

## ⚠️ تحذيرات قانونية مهمة

### Vercel Hobby ≠ تجاري

> Vercel Hobby tier يحظر صراحةً «any commercial use» في شروط الخدمة.

**مسموح في Hobby**:
- ✅ Live Demo
- ✅ MVP لإثبات الفكرة
- ✅ Portfolio
- ✅ Educational
- ✅ Personal blog

**ممنوع في Hobby (يتطلّب Pro)**:
- ❌ تحصيل اشتراكات شهرية
- ❌ بيع منتجات
- ❌ Google AdSense بحجم كبير (إعلانات متكرّرة)
- ❌ أي API يُستخدم تجارياً
- ❌ SaaS (حتى لو مجاني للمستخدمين)

### متى تُصبح تجارياً؟

- ✅ عند بدء تحصيل رسوم الاشتراك
- ✅ عند بيع باقات الإعلانات
- ✅ عند تقديم خدمات مدفوعة (حتى لو بمقابل رمزي)
- ✅ عند استخدام المنصة كأداة لتوليد دخل (ولو غير مباشر)

في تلك المرحلة: **ترقية إلزامية** لـVercel Pro أو VPS.

---

## 📚 موارد إضافية

- [Next.js 16 Docs](https://nextjs.org/docs)
- [Prisma PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Hobby Limits](https://vercel.com/docs/limits/usage)
- [Let's Encrypt](https://letsencrypt.org)
- [Moroccan hosting providers list](https://github.com/moroccoweb/all-morocco-hosting)

---

## 🆘 استكشاف الأخطاء

### خطأ: `Can't reach database server`

```bash
# تحقّق من URL
echo $DATABASE_URL
# تأكّد أن ?pgbouncer=true موجود لـSupabase pooler
# تأكّد أن المنفذ 6543 (pooler) وليس 5432 (direct)
```

### خطأ: `PrismaClientInitializationError`

```bash
# إعادة توليد العميل
bun run db:generate
# ثم أعد النشر
vercel --prod
```

### خطأ: `Hydration mismatch`

- تأكّد أن `<html lang="ar" dir="rtl" suppressHydrationWarning>` موجود
- تأكّد أن `ThemeProvider` لديه `suppressHydrationWarning`
- مكوّنات client-side تستخدم `mounted` state قبل العرض

### خطأ: `Unauthorized` في API

- تأكّد أن `NEXTAUTH_SECRET` مضبوط
- تأكّد أن `NEXTAUTH_URL` = رابط Vercel الفعلي
- تأكّد أن الكوكيز مسموعة (`Secure` + `SameSite=Lax`)

---

## 📞 الدعم

للمساعدة في النشر:
- افتح issue على GitHub
- راسلنا: contact@syba-community.ma

---

**© 2025 سيدي يوسف بن علي العاصمة. من حي إلى عاصمة.**
