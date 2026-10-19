/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,email]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email" VARCHAR(255),
ADD COLUMN     "passwordHash" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_email_key" ON "users"("tenantId", "email");
