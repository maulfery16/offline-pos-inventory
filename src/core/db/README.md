# core/db
Prisma client instantiation. Import `prisma` from here — never create a new PrismaClient elsewhere.
Uses global singleton to prevent connection pool exhaustion during Next.js hot-reloads in development.
