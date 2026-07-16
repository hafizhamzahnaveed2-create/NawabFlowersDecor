-- CreateEnum
CREATE TYPE "PaymentVerificationStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "paymentAccountId" TEXT,
ADD COLUMN "transactionId" TEXT,
ADD COLUMN "receiptImageUrl" TEXT,
ADD COLUMN "paymentVerificationStatus" "PaymentVerificationStatus" NOT NULL DEFAULT 'NOT_REQUIRED';

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "PaymentAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "accountTitle" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "iconKey" TEXT NOT NULL DEFAULT 'bank',
    "instructions" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialLink" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAccount_slug_key" ON "PaymentAccount"("slug");

-- CreateIndex
CREATE INDEX "PaymentAccount_isActive_sortOrder_idx" ON "PaymentAccount"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SocialLink_platform_key" ON "SocialLink"("platform");

-- CreateIndex
CREATE INDEX "SocialLink_isEnabled_sortOrder_idx" ON "SocialLink"("isEnabled", "sortOrder");

-- CreateIndex
CREATE INDEX "Order_paymentVerificationStatus_idx" ON "Order"("paymentVerificationStatus");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_paymentAccountId_fkey" FOREIGN KEY ("paymentAccountId") REFERENCES "PaymentAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
