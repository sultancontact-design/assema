import { PrismaClient } from '@prisma/client'

// v70.0: bump cache key whenever the Prisma schema changes (e.g. added Commune)
// so that a long-running dev server's HMR-cached PrismaClient is replaced with
// a fresh instance that exposes the new model accessors.
const PRISMA_CACHE_VERSION = 'v70.0-commune'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient | undefined
  __prismaVersion?: string
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

// Recreate the client if the schema version changed since the last boot.
// Also: runtime guard — if the cached client lacks the `commune` accessor
// (added in v70.0), drop it and rebuild. Note: in long-running dev sessions
// where Turbopack has cached the @prisma/client module graph, even a fresh
// PrismaClient instance may not expose `commune` — in that case route handlers
// should fall back to `db.$queryRawUnsafe` SQL.
let db: PrismaClient
const cached = globalForPrisma.prisma
const versionMatches = globalForPrisma.__prismaVersion === PRISMA_CACHE_VERSION
const cachedHasCommune = !!(cached && (cached as unknown as Record<string, unknown>).commune)

if (
  process.env.NODE_ENV !== 'production' &&
  versionMatches &&
  cached &&
  cachedHasCommune
) {
  db = cached
} else {
  if (cached) {
    try { void cached.$disconnect() } catch { /* ignore */ }
  }
  db = createPrismaClient()
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = db
    globalForPrisma.__prismaVersion = PRISMA_CACHE_VERSION
  }
}

export { db }



