import "dotenv/config";
import bcrypt from "bcryptjs";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../lib/generated/prisma/client";

neonConfig.webSocketConstructor = ws;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

const PERMISSIONS = [
  { key: "catalog.read", description: "View products and categories" },
  { key: "catalog.write", description: "Create and edit products, categories, stock" },
  { key: "orders.read", description: "View orders" },
  { key: "orders.fulfill", description: "Update order status and fulfilment" },
  { key: "content.write", description: "Edit homepage sections, banners, FAQs" },
  { key: "staff.manage", description: "Manage staff accounts and roles" },
];

const STAFF_ROLES: { name: string; description: string; permissions: string[] }[] = [
  {
    name: "Admin",
    description: "Full access to everything",
    permissions: PERMISSIONS.map((p) => p.key),
  },
  {
    name: "Catalog Manager",
    description: "Manages products, stock, and categories",
    permissions: ["catalog.read", "catalog.write", "orders.read"],
  },
  {
    name: "Order Fulfillment",
    description: "Processes and delivers orders",
    permissions: ["catalog.read", "orders.read", "orders.fulfill"],
  },
];

// Primary category tree matching the flower-domain taxonomy (Section 0).
const CATEGORIES: { name: string; slug: string; subs: { name: string; slug: string }[] }[] = [
  {
    name: "Bouquets",
    slug: "bouquets",
    subs: [
      { name: "Birthday", slug: "birthday-bouquets" },
      { name: "Anniversary", slug: "anniversary-bouquets" },
      { name: "Wedding", slug: "wedding-bouquets" },
      { name: "Condolence", slug: "condolence-bouquets" },
      { name: "Congratulations", slug: "congratulations-bouquets" },
    ],
  },
  {
    name: "Raw Materials",
    slug: "raw-materials",
    subs: [
      { name: "Stems", slug: "stems" },
      { name: "Greenery", slug: "greenery" },
      { name: "Wrapping & Ribbons", slug: "wrapping-ribbons" },
      { name: "Vases & Boxes", slug: "vases-boxes" },
      { name: "Foam & Cards", slug: "foam-cards" },
    ],
  },
  {
    name: "Gift Add-ons",
    slug: "gift-addons",
    subs: [
      { name: "Chocolates", slug: "chocolates" },
      { name: "Cards", slug: "cards" },
      { name: "Teddy Bears", slug: "teddy-bears" },
      { name: "Balloons", slug: "balloons" },
    ],
  },
];

// Cross-cutting browse axes as tags.
const TAGS: { kind: "OCCASION" | "FLOWER_TYPE" | "COLOR" | "SEASON"; names: string[] }[] = [
  {
    kind: "OCCASION",
    names: ["Birthday", "Anniversary", "Wedding", "Condolence", "Congratulations", "Eid", "Valentine's Day"],
  },
  { kind: "FLOWER_TYPE", names: ["Roses", "Lilies", "Orchids", "Tulips", "Mixed"] },
  { kind: "COLOR", names: ["Red", "Pink", "White", "Yellow", "Purple"] },
  { kind: "SEASON", names: ["Spring", "Summer", "Autumn", "Winter"] },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  // Permissions and staff roles
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: permission,
    });
  }

  for (const role of STAFF_ROLES) {
    const staffRole = await prisma.staffRole.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: { name: role.name, description: role.description },
    });
    const permissions = await prisma.permission.findMany({
      where: { key: { in: role.permissions } },
    });
    for (const permission of permissions) {
      await prisma.staffRolePermission.upsert({
        where: {
          staffRoleId_permissionId: {
            staffRoleId: staffRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: { staffRoleId: staffRole.id, permissionId: permission.id },
      });
    }
  }

  // Initial admin user
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const adminRole = await prisma.staffRole.findUnique({ where: { name: "Admin" } });
    const admin = await prisma.user.upsert({
      where: { email: adminEmail.toLowerCase() },
      update: { role: "ADMIN" },
      create: {
        email: adminEmail.toLowerCase(),
        name: "Store Admin",
        passwordHash,
        role: "ADMIN",
      },
    });
    await prisma.staffProfile.upsert({
      where: { userId: admin.id },
      update: { staffRoleId: adminRole?.id },
      create: { userId: admin.id, staffRoleId: adminRole?.id },
    });
    console.log(`Admin user ready: ${adminEmail}`);
  } else {
    console.warn("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping admin user.");
  }

  // Category tree
  for (const [index, category] of CATEGORIES.entries()) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, sortOrder: index },
      create: { name: category.name, slug: category.slug, sortOrder: index },
    });
    for (const [subIndex, sub] of category.subs.entries()) {
      await prisma.subCategory.upsert({
        where: { slug: sub.slug },
        update: { name: sub.name, sortOrder: subIndex },
        create: {
          name: sub.name,
          slug: sub.slug,
          sortOrder: subIndex,
          categoryId: created.id,
        },
      });
    }
  }

  // Tags
  for (const group of TAGS) {
    for (const name of group.names) {
      const slug = `${group.kind.toLowerCase().replace("_", "-")}-${slugify(name)}`;
      await prisma.tag.upsert({
        where: { slug },
        update: { name },
        create: { kind: group.kind, name, slug },
      });
    }
  }

  const counts = {
    categories: await prisma.category.count(),
    subCategories: await prisma.subCategory.count(),
    tags: await prisma.tag.count(),
    staffRoles: await prisma.staffRole.count(),
    permissions: await prisma.permission.count(),
    users: await prisma.user.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
