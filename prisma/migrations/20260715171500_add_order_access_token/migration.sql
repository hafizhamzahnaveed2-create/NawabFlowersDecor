-- Add Order.accessToken as nullable, backfill existing rows with random
-- tokens, then enforce NOT NULL + uniqueness.
ALTER TABLE "Order" ADD COLUMN "accessToken" TEXT;

UPDATE "Order"
SET "accessToken" = md5(random()::text || clock_timestamp()::text || id)
WHERE "accessToken" IS NULL;

ALTER TABLE "Order" ALTER COLUMN "accessToken" SET NOT NULL;

CREATE UNIQUE INDEX "Order_accessToken_key" ON "Order"("accessToken");
