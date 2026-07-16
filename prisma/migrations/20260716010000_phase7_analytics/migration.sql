-- CreateTable
CREATE TABLE "StoreEvent" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "path" TEXT,
    "productId" TEXT,
    "userId" TEXT,
    "sessionId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoreEvent_kind_createdAt_idx" ON "StoreEvent"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "StoreEvent_path_createdAt_idx" ON "StoreEvent"("path", "createdAt");

-- CreateIndex
CREATE INDEX "StoreEvent_productId_createdAt_idx" ON "StoreEvent"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "StoreEvent_sessionId_createdAt_idx" ON "StoreEvent"("sessionId", "createdAt");

-- Daily order rollup for analytics charts (excludes cancelled).
CREATE OR REPLACE VIEW analytics_daily_orders AS
SELECT
  (date_trunc('day', "createdAt" AT TIME ZONE 'UTC'))::date AS day,
  COUNT(*)::integer AS order_count,
  COALESCE(SUM("total"), 0)::numeric AS revenue
FROM "Order"
WHERE status <> 'CANCELLED'
GROUP BY 1;

-- Product sales rollup (all time; filter by joining Order in app queries when needed).
CREATE OR REPLACE VIEW analytics_product_sales AS
SELECT
  oi."productId" AS product_id,
  SUM(oi.quantity)::integer AS units,
  COALESCE(SUM(oi."lineTotal"), 0)::numeric AS revenue
FROM "OrderItem" oi
JOIN "Order" o ON o.id = oi."orderId"
WHERE o.status <> 'CANCELLED'
  AND oi."productId" IS NOT NULL
GROUP BY oi."productId";
