import { readFileSync } from 'fs'
import { join, resolve } from 'path'
import { createRequire } from 'module'

// -----------------------------------------------------------------
//  SCHEMA_VERSION: عندما يتغيّر schema (حقول جديدة على موديل موجود)،
//  نرفع هذا الرقم. النسخة المخزّنة عالمياً تُقارَن بهذه القيمة — لو
//  اختلفت، يُهدم الكاش ونُنشئ PrismaClient جديد يلتقط آخر تطبيق للـgenerate.
// -----------------------------------------------------------------
const SCHEMA_VERSION = 'v5-economy-2025-09-24'

// -----------------------------------------------------------------
//  PrismaClient — يُحمَّل ديناميكياً عبر createRequire لتفادي كاش Turbopack.
//  Turbopack قد يُخزّن @prisma/client في ذاكرته الداخلية، فلا يلتقط
//  تحديثات prisma generate. باستخدام createRequire مستقل، نُجبر على
//  إعادة قراءة node_modules/.prisma/client/default.js في كل مرة.
// -----------------------------------------------------------------
const projectRequire = createRequire(resolve(process.cwd(), 'package.json'))
const PrismaClientCtor: typeof import('@prisma/client').PrismaClient =
  projectRequire('@prisma/client').PrismaClient
type PrismaClient = InstanceType<typeof PrismaClientCtor>

// -----------------------------------------------------------------
//  ت.override: لو كان DATABASE_URL في بيئة النظام غير صالح (sqlite بدل
//  postgres)، نُجبر قراءته من ملف .env المحلي. يحدث هذا في بعض بيئات
//  sandbox التي تضبط DATABASE_URL افتراضياً لـ sqlite.
// -----------------------------------------------------------------
function ensureCorrectDbUrl(): void {
  const current = process.env.DATABASE_URL ?? ''
  if (current.startsWith('postgres')) return
  try {
    const envPath = join(process.cwd(), '.env')
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (key === 'DATABASE_URL' || key === 'DIRECT_URL') {
        if (value.startsWith('postgres')) {
          process.env[key] = value
        }
      }
    }
  } catch {
    // تجاهل
  }
}

ensureCorrectDbUrl()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  __prismaUrl?: string
  __prismaSchemaVersion?: string
}

// فحص: لو تغيّر DATABASE_URL (بعد ensureCorrectDbUrl)، نُلغي الكاش
// ونتشئ PrismaClient جديد ليأخذ القيمة الصحيحة.
const currentUrl = process.env.DATABASE_URL ?? ''
const cachedUrl = globalForPrisma.__prismaUrl
if (globalForPrisma.prisma && cachedUrl !== currentUrl) {
  try {
    void globalForPrisma.prisma.$disconnect()
  } catch {
    // تجاهل
  }
  globalForPrisma.prisma = undefined
}
globalForPrisma.__prismaUrl = currentUrl

// فحص: لو تغيّر SCHEMA_VERSION (مثلاً حقول جديدة على District)،
// نُهدم الكاش ونُنشئ عميلاً جديداً يلتقط آخر prisma generate.
if (
  globalForPrisma.prisma &&
  globalForPrisma.__prismaSchemaVersion !== SCHEMA_VERSION
) {
  try {
    void globalForPrisma.prisma.$disconnect()
  } catch {
    // تجاهل
  }
  globalForPrisma.prisma = undefined
}
globalForPrisma.__prismaSchemaVersion = SCHEMA_VERSION

// فحص "العته": إن لم يكن لدى العميل موديل جديد، نُعيد التشكيل
function isStalePrisma(p: PrismaClient | undefined): boolean {
  if (!p) return false
  try {
    const probe = p as unknown as { allowedIP?: unknown }
    return !probe.allowedIP
  } catch {
    return false
  }
}

if (process.env.NODE_ENV !== 'production' && globalForPrisma.prisma) {
  if (isStalePrisma(globalForPrisma.prisma)) {
    try {
      void globalForPrisma.prisma.$disconnect()
    } catch {
      // تجاهل
    }
    globalForPrisma.prisma = undefined
  }
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClientCtor({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
