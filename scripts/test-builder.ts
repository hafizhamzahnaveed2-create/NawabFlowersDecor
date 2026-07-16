// Smoke test: create a custom bouquet via the API and verify the snapshot.
import "dotenv/config";
import { prisma } from "../lib/db";

async function main() {
  const stems = await prisma.bouquetComponent.findMany({
    where: { kind: "STEM", isActive: true },
    take: 2,
  });
  const wrap = await prisma.bouquetComponent.findFirst({
    where: { kind: "WRAP", isActive: true },
  });
  if (stems.length < 1) throw new Error("No stems seeded");

  const items = [
    { componentId: stems[0].id, quantity: 6 },
    ...(stems[1] ? [{ componentId: stems[1].id, quantity: 3 }] : []),
    ...(wrap ? [{ componentId: wrap.id, quantity: 1 }] : []),
  ];

  const res = await fetch("http://localhost:3000/api/builder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Smoke Test Bouquet",
      cardMessage: "Just a test",
      items,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`API ${res.status}: ${JSON.stringify(data)}`);

  const bouquet = await prisma.customBouquet.findUniqueOrThrow({
    where: { id: data.bouquet.id },
    include: { items: true },
  });

  console.log("Custom bouquet:", bouquet.id);
  console.log("Share token:", bouquet.shareToken);
  console.log("Total:", Number(bouquet.totalPrice));
  console.log(
    "Items:",
    bouquet.items.map((i) => `${i.componentName}×${i.quantity}`).join(", "),
  );
  console.log("API total matches DB:", Number(bouquet.totalPrice) === data.bouquet.totalPrice);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
