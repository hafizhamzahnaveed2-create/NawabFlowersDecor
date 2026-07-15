// Dev smoke test for the checkout API: places a guest order for tomorrow
// and prints the stored vs requested delivery date plus stock movement.
import "dotenv/config";
import { prisma } from "../lib/db";
import { earliestDeliveryDate, toDateInputValue } from "../lib/delivery";

async function main() {
  const product = await prisma.product.findUniqueOrThrow({
    where: { slug: "golden-hour" },
    select: { id: true, stock: true, name: true },
  });
  const requestedDate = toDateInputValue(earliestDeliveryDate());

  const res = await fetch("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ productId: product.id, quantity: 2 }],
      deliveryDate: requestedDate,
      deliveryTimeSlot: "15:00 – 18:00",
      giftMessage: "Guest checkout smoke test",
      recipientName: "Test Recipient",
      recipientPhone: "0311-0000000",
      addressLine1: "Test Street 1",
      city: "Lahore",
      guestEmail: "guest@example.com",
      paymentMethod: "cod",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`API ${res.status}: ${JSON.stringify(data)}`);

  const order = await prisma.order.findUniqueOrThrow({
    where: { orderNumber: data.order.orderNumber },
    include: { items: true },
  });
  const productAfter = await prisma.product.findUniqueOrThrow({
    where: { id: product.id },
    select: { stock: true },
  });

  console.log("Order:", order.orderNumber);
  console.log("Requested delivery date:", requestedDate);
  console.log(
    "Stored delivery date (UTC):",
    order.deliveryDate.toISOString().slice(0, 10),
  );
  console.log("Match:", order.deliveryDate.toISOString().slice(0, 10) === requestedDate);
  console.log("Guest email:", order.guestEmail, "| userId:", order.userId);
  console.log(
    `Stock ${product.name}: ${product.stock} -> ${productAfter.stock} (expected ${product.stock - 2})`,
  );
  console.log(
    "Totals:",
    Number(order.subtotal),
    "+",
    Number(order.deliveryFee),
    "=",
    Number(order.total),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
