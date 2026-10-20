/**
 * Production seed — run once on Vercel deploy. Idempotent.
 *
 * Creates: RBBL Tenant, BGBGN Branch, TenantAdmin, default Owner user.
 * Does NOT create sample products (production environment).
 *
 * Usage:
 *   DATABASE_URL=... npx ts-node --compiler-options '{\module\:\CommonJS\}' prisma/seed-production.ts
 *   Or: npm run prisma:seed:prod
 *
 * Env vars (set in Vercel dashboard before go-live):
 *   ADMIN_PASSWORD  — device registration password (default: admin123)
 *   OWNER_EMAIL     — owner login email (default: owner@rbbl.id)
 *   OWNER_PASSWORD  — owner login password (default: owner123)
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding production database (RBBL)...');

  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
  const ownerEmail    = process.env.OWNER_EMAIL    ?? 'owner@rbbl.id';
  const ownerPassword = process.env.OWNER_PASSWORD ?? 'owner123';

  // Tenant
  const tenant = await prisma.tenant.upsert({
    where: { code: 'RBBL' },
    update: { name: 'Rumah Beku Bu Lilim', address: 'Jalan Bagbagan, Palabuhanratu', phone: '08156267498', email: 'info_rbbl@gmail.com' },
    create: { name: 'Rumah Beku Bu Lilim', code: 'RBBL', address: 'Jalan Bagbagan, Palabuhanratu', phone: '08156267498', email: 'info_rbbl@gmail.com' },
  });
  console.log('  Tenant: ' + tenant.name);

  // Branch
  const branch = await prisma.branch.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'BGBGN' } },
    update: { name: 'Rumah Beku Bu Lilim', address: 'Jalan Bagbagan, Palabuhanratu' },
    create: { tenantId: tenant.id, name: 'Rumah Beku Bu Lilim', code: 'BGBGN', address: 'Jalan Bagbagan, Palabuhanratu' },
  });
  console.log('  Branch: ' + branch.name);

  // TenantAdmin
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.tenantAdmin.upsert({
    where: { tenantId: tenant.id },
    update: { passwordHash: adminPasswordHash },
    create: { tenantId: tenant.id, passwordHash: adminPasswordHash },
  });
  console.log('  TenantAdmin password set');

  // Default Owner
  const dummyPinHash = await bcrypt.hash('0000', 12);
  const ownerPasswordHash = await bcrypt.hash(ownerPassword, 12);
  const owner = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: ownerEmail } },
    update: { passwordHash: ownerPasswordHash },
    create: {
      tenantId: tenant.id, name: 'Owner RBBL', email: ownerEmail,
      pinHash: dummyPinHash, passwordHash: ownerPasswordHash, role: 'owner', isActive: true,
    },
  });
  console.log('  Owner: ' + owner.name + ' — ' + ownerEmail);

  console.log('');
  console.log("Production seed complete (RBBL)!");
  console.log('');
  console.log('Device Registration — POST /api/auth/register:');
  console.log('   tenantCode:    RBBL');
  console.log('   branchCode:    BGBGN');
  console.log('   adminPassword: ' + adminPassword);
  console.log('');
  console.log('Owner login — POST /api/auth/login:');
  console.log('   email:    ' + ownerEmail);
  console.log('   password: ' + ownerPassword);
  console.log('');
  console.log("PERINGATAN: Ganti env vars di Vercel sebelum go-live!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
