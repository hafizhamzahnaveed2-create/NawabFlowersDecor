// Quick health check: connects through the pooled Neon URL exactly as the
// app does (lib/db) and reports row counts. Run: npx tsx scripts/verify-db.ts
import "dotenv/config";
import { prisma } from "../lib/db";

async function main() {
  const [users, categories, subCategories, tags, staffRoles, permissions] =
    await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.subCategory.count(),
      prisma.tag.count(),
      prisma.staffRole.count(),
      prisma.permission.count(),
    ]);

  console.log("Pooled Neon connection OK.");
  console.table({ users, categories, subCategories, tags, staffRoles, permissions });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
