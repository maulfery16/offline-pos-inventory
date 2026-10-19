/**
 * Seed script for end-to-end development/testing.
 *
 * Creates:
 *   - 1 Tenant  : Toko Lintas Cabang  (code: TLC)
 *   - 1 Branch  : Toko Pusat Jakarta  (code: PUSAT)
 *   - 1 TenantAdmin (device registration password: admin123)
 *   - 3 Users:
 *       kasir   → Budi Santoso     PIN: 1234
 *       admin   → Siti Rahayu      email: siti@tlc.id   password: admin123
 *       owner   → Ahmad Wijaya     email: ahmad@tlc.id  password: owner123
 *   - 3 sample Products with InventoryBatches
 *
 * Run:
 *   DATABASE_URL=... npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
 * Or add to package.json prisma.seed and run:
 *   DATABASE_URL=... npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱  Seeding database…');

  // ── Tenant ────────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { code: 'TLC' },
    update: {},
    create: {
      name: 'Toko Lintas Cabang',
      code: 'TLC',
      address: 'Jl. Sudirman No. 1, Jakarta Selatan',
      phone: '021-12345678',
      email: 'info@tlc.id',
    },
  });
  console.log(`  ✔  Tenant: ${tenant.name} (${tenant.id})`);

  // ── Branch ────────────────────────────────────────────────────────────────
  const branch = await prisma.branch.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'PUSAT' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Toko Pusat — Jakarta Selatan',
      code: 'PUSAT',
      address: 'Jl. Sudirman No. 1, Jakarta Selatan',
    },
  });
  console.log(`  ✔  Branch: ${branch.name} (${branch.id})`);

  // ── TenantAdmin (device registration) ────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  await prisma.tenantAdmin.upsert({
    where: { tenantId: tenant.id },
    update: { passwordHash: adminPasswordHash },
    create: {
      tenantId: tenant.id,
      passwordHash: adminPasswordHash,
    },
  });
  console.log('  ✔  TenantAdmin password: admin123');

  // ── Users ─────────────────────────────────────────────────────────────────
  const dummyHash = await bcrypt.hash('0000', 12); // placeholder for non-PIN users

  // Kasir: PIN = 1234
  const kasirPinHash = await bcrypt.hash('1234', 12);
  const kasir = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'budi@tlc.id' } },
    update: { pinHash: kasirPinHash },
    create: {
      tenantId: tenant.id,
      name: 'Budi Santoso',
      email: 'budi@tlc.id',
      pinHash: kasirPinHash,
      role: 'kasir',
      isActive: true,
    },
  });
  console.log(`  ✔  Kasir: ${kasir.name} — PIN: 1234`);

  // Admin: email login
  const adminHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'siti@tlc.id' } },
    update: { passwordHash: adminHash },
    create: {
      tenantId: tenant.id,
      name: 'Siti Rahayu',
      email: 'siti@tlc.id',
      pinHash: dummyHash,
      passwordHash: adminHash,
      role: 'admin',
      isActive: true,
    },
  });
  console.log(`  ✔  Admin: ${admin.name} — email: siti@tlc.id  password: admin123`);

  // Owner: email login
  const ownerHash = await bcrypt.hash('owner123', 12);
  const owner = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'ahmad@tlc.id' } },
    update: { passwordHash: ownerHash },
    create: {
      tenantId: tenant.id,
      name: 'Ahmad Wijaya',
      email: 'ahmad@tlc.id',
      pinHash: dummyHash,
      passwordHash: ownerHash,
      role: 'owner',
      isActive: true,
    },
  });
  console.log(`  ✔  Owner: ${owner.name} — email: ahmad@tlc.id  password: owner123`);

  // ── Products + Batches ────────────────────────────────────────────────────
  const products = [
    {
      sku: 'SKU-001',
      name: 'Indomie Goreng',
      barcode: '8992388011565',
      unit: 'pcs',
      defaultPrice: 3500,
      reorderPoint: 20,
      batches: [
        { batchNumber: 'BATCH-A1', unitCost: 2800, qty: 100, expiryDays: 180 },
        { batchNumber: 'BATCH-A2', unitCost: 2900, qty: 50,  expiryDays: 90  },
      ],
    },
    {
      sku: 'SKU-002',
      name: 'Aqua 600ml',
      barcode: '8999999025356',
      unit: 'botol',
      defaultPrice: 4000,
      reorderPoint: 30,
      batches: [
        { batchNumber: 'BATCH-B1', unitCost: 3000, qty: 200, expiryDays: 365 },
      ],
    },
    {
      sku: 'SKU-003',
      name: 'Teh Botol Sosro 250ml',
      barcode: '8997002050308',
      unit: 'botol',
      defaultPrice: 5000,
      reorderPoint: 15,
      batches: [
        { batchNumber: 'BATCH-C1', unitCost: 3800, qty: 80,  expiryDays: 60  },
        { batchNumber: 'BATCH-C2', unitCost: 3900, qty: 40,  expiryDays: 7   }, // near expiry
      ],
    },
  ];

  const now = new Date();

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { tenantId_sku: { tenantId: tenant.id, sku: p.sku } },
      update: { name: p.name, defaultPrice: p.defaultPrice },
      create: {
        tenantId: tenant.id,
        sku: p.sku,
        name: p.name,
        barcode: p.barcode,
        unit: p.unit,
        defaultPrice: p.defaultPrice,
        reorderPoint: p.reorderPoint,
      },
    });

    for (const b of p.batches) {
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + b.expiryDays);

      await prisma.inventoryBatch.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          productId: product.id,
          batchNumber: b.batchNumber,
          receivedDate: now,
          expiryDate,
          unitCost: b.unitCost,
          initialQty: b.qty,
          currentQty: b.qty,
        },
      });
    }

    console.log(`  ✔  Product: ${p.name} (${p.batches.length} batch)`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n✅  Seed complete!\n');
  console.log('Device Registration (POST /api/auth/register):');
  console.log(`   tenantCode:   TLC`);
  console.log(`   branchCode:   PUSAT`);
  console.log(`   deviceName:   iPad Kasir`);
  console.log(`   adminPassword: admin123\n`);
  console.log('Kasir login (POST /api/auth/pin-verify):');
  console.log(`   userId: ${kasir.id}`);
  console.log(`   pin:    1234\n`);
  console.log('Admin login (POST /api/auth/login):');
  console.log(`   email:    siti@tlc.id`);
  console.log(`   password: admin123\n`);
  console.log('Owner login (POST /api/auth/login):');
  console.log(`   email:    ahmad@tlc.id`);
  console.log(`   password: owner123\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
