-- AlterTable: add contact fields to tenants
ALTER TABLE "tenants" ADD COLUMN "address" TEXT;
ALTER TABLE "tenants" ADD COLUMN "phone" VARCHAR(50);
ALTER TABLE "tenants" ADD COLUMN "email" VARCHAR(255);
