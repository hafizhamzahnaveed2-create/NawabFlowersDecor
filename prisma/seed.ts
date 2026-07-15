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

function tagSlug(kind: string, name: string) {
  return `${kind.toLowerCase().replace("_", "-")}-${slugify(name)}`;
}

const img = (id: string) => `https://images.unsplash.com/${id}?w=1200&q=80`;

type SeedProduct = {
  name: string;
  type: "BOUQUET" | "RAW_MATERIAL" | "ADDON";
  description: string;
  categorySlug: string;
  subCategorySlug: string;
  price: number;
  salePrice?: number;
  stock: number;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  images: string[]; // Unsplash photo ids (verified by scripts/check-images.ts)
  tags?: [kind: string, name: string][];
  variants?: { name: string; price: number; stock: number }[];
};

const PRODUCTS: SeedProduct[] = [
  // --- Bouquets ---
  {
    name: "Blush Rose Hand-Tied",
    type: "BOUQUET",
    description:
      "Soft pink roses wrapped in ivory paper with a satin ribbon. Our most-loved bouquet for birthdays and just-because moments.",
    categorySlug: "bouquets",
    subCategorySlug: "birthday-bouquets",
    price: 4500,
    stock: 25,
    isBestSeller: true,
    images: ["photo-1526047932273-341f2a7631f9", "photo-1455659817273-f96807779a8a"],
    tags: [["OCCASION", "Birthday"], ["FLOWER_TYPE", "Roses"], ["COLOR", "Pink"]],
    variants: [
      { name: "12 stems", price: 4500, stock: 15 },
      { name: "24 stems", price: 8200, stock: 8 },
      { name: "36 stems", price: 11800, stock: 2 },
    ],
  },
  {
    name: "Crimson Devotion",
    type: "BOUQUET",
    description:
      "Deep red roses, tightly gathered and dressed in burgundy wrap — the classic anniversary statement.",
    categorySlug: "bouquets",
    subCategorySlug: "anniversary-bouquets",
    price: 5200,
    stock: 18,
    isBestSeller: true,
    images: ["photo-1520763185298-1b434c919102", "photo-1453747063559-36695c8771bd"],
    tags: [["OCCASION", "Anniversary"], ["OCCASION", "Valentine's Day"], ["FLOWER_TYPE", "Roses"], ["COLOR", "Red"]],
    variants: [
      { name: "12 stems", price: 5200, stock: 10 },
      { name: "24 stems", price: 9600, stock: 8 },
    ],
  },
  {
    name: "Meadow Morning",
    type: "BOUQUET",
    description:
      "A loose, garden-style mix of seasonal blooms and wild greenery — like a walk through a spring meadow.",
    categorySlug: "bouquets",
    subCategorySlug: "congratulations-bouquets",
    price: 3800,
    salePrice: 3200,
    stock: 20,
    isNewArrival: true,
    images: ["photo-1490750967868-88aa4486c946", "photo-1494972308805-463bc619d34e"],
    tags: [["OCCASION", "Congratulations"], ["FLOWER_TYPE", "Mixed"], ["SEASON", "Spring"]],
  },
  {
    name: "Ivory Grace",
    type: "BOUQUET",
    description:
      "White lilies and cream roses in a quiet, elegant arrangement. A gentle way to say what words can't.",
    categorySlug: "bouquets",
    subCategorySlug: "condolence-bouquets",
    price: 6000,
    stock: 12,
    images: ["photo-1561181286-d3fee7d55364", "photo-1502977249166-824b3a8a4d6d"],
    tags: [["OCCASION", "Condolence"], ["FLOWER_TYPE", "Lilies"], ["COLOR", "White"]],
  },
  {
    name: "Bridal Cascade",
    type: "BOUQUET",
    description:
      "A flowing bridal bouquet of white orchids, roses, and trailing eucalyptus. Made to order for your day.",
    categorySlug: "bouquets",
    subCategorySlug: "wedding-bouquets",
    price: 15000,
    stock: 5,
    isFeatured: true,
    images: ["photo-1471696035578-3d8c78d99684", "photo-1519378058457-4c29a0a2efac"],
    tags: [["OCCASION", "Wedding"], ["FLOWER_TYPE", "Orchids"], ["COLOR", "White"]],
  },
  {
    name: "Tulip Sunrise",
    type: "BOUQUET",
    description:
      "Two dozen tulips in warm sunrise shades, wrapped simply so the blooms do the talking.",
    categorySlug: "bouquets",
    subCategorySlug: "birthday-bouquets",
    price: 4200,
    salePrice: 3500,
    stock: 15,
    isNewArrival: true,
    images: ["photo-1487530811176-3780de880c2d", "photo-1508610048659-a06b669e3321"],
    tags: [["OCCASION", "Birthday"], ["FLOWER_TYPE", "Tulips"], ["COLOR", "Yellow"], ["SEASON", "Spring"]],
  },
  {
    name: "Golden Hour",
    type: "BOUQUET",
    description:
      "Sunflowers and golden roses for the brightest people in your life. Guaranteed to lift a room.",
    categorySlug: "bouquets",
    subCategorySlug: "congratulations-bouquets",
    price: 3600,
    stock: 22,
    isBestSeller: true,
    images: ["photo-1518895949257-7621c3c786d7"],
    tags: [["OCCASION", "Congratulations"], ["FLOWER_TYPE", "Mixed"], ["COLOR", "Yellow"], ["SEASON", "Summer"]],
  },
  {
    name: "First Light Posy",
    type: "BOUQUET",
    description:
      "A petite posy of mixed blooms — small in size, generous in feeling. Perfect for desks and bedside tables.",
    categorySlug: "bouquets",
    subCategorySlug: "birthday-bouquets",
    price: 2500,
    stock: 30,
    isNewArrival: true,
    images: ["photo-1522748906645-95d8adfd52c7", "photo-1509587584298-0f3b3a3a1797"],
    tags: [["OCCASION", "Birthday"], ["FLOWER_TYPE", "Mixed"], ["COLOR", "Pink"]],
  },
  {
    name: "Eid Mubarak Arrangement",
    type: "BOUQUET",
    description:
      "A festive arrangement of white and green blooms for Eid mornings — delivered fresh before the day begins.",
    categorySlug: "bouquets",
    subCategorySlug: "congratulations-bouquets",
    price: 5500,
    stock: 10,
    isFeatured: true,
    images: ["photo-1469259943454-aa100abba749"],
    tags: [["OCCASION", "Eid"], ["FLOWER_TYPE", "Mixed"], ["COLOR", "White"]],
  },
  {
    name: "Velvet Evening",
    type: "BOUQUET",
    description:
      "Burgundy and plum blooms with dark foliage — dramatic, romantic, unforgettable.",
    categorySlug: "bouquets",
    subCategorySlug: "anniversary-bouquets",
    price: 6800,
    salePrice: 5900,
    stock: 8,
    images: ["photo-1453747063559-36695c8771bd", "photo-1520763185298-1b434c919102"],
    tags: [["OCCASION", "Anniversary"], ["FLOWER_TYPE", "Mixed"], ["COLOR", "Purple"], ["SEASON", "Winter"]],
  },

  // --- Raw materials ---
  {
    name: "Red Rose — Single Stem",
    type: "RAW_MATERIAL",
    description:
      "Premium long-stem red rose, sold individually. Build your own bouquet or add drama to an arrangement.",
    categorySlug: "raw-materials",
    subCategorySlug: "stems",
    price: 250,
    stock: 200,
    isBestSeller: true,
    images: ["photo-1520763185298-1b434c919102"],
    tags: [["FLOWER_TYPE", "Roses"], ["COLOR", "Red"]],
  },
  {
    name: "Pink Rose — Single Stem",
    type: "RAW_MATERIAL",
    description: "Soft blush rose on a long stem. Lovely alone, better in dozens.",
    categorySlug: "raw-materials",
    subCategorySlug: "stems",
    price: 250,
    stock: 180,
    images: ["photo-1455659817273-f96807779a8a"],
    tags: [["FLOWER_TYPE", "Roses"], ["COLOR", "Pink"]],
  },
  {
    name: "White Lily — Single Stem",
    type: "RAW_MATERIAL",
    description:
      "Fragrant oriental lily with two to three heads per stem. Opens over several days.",
    categorySlug: "raw-materials",
    subCategorySlug: "stems",
    price: 350,
    stock: 90,
    images: ["photo-1561181286-d3fee7d55364"],
    tags: [["FLOWER_TYPE", "Lilies"], ["COLOR", "White"]],
  },
  {
    name: "Tulip — Single Stem",
    type: "RAW_MATERIAL",
    description: "Seasonal tulip stems in mixed warm shades.",
    categorySlug: "raw-materials",
    subCategorySlug: "stems",
    price: 180,
    stock: 120,
    isNewArrival: true,
    images: ["photo-1487530811176-3780de880c2d"],
    tags: [["FLOWER_TYPE", "Tulips"], ["SEASON", "Spring"]],
  },
  {
    name: "Eucalyptus Bunch",
    type: "RAW_MATERIAL",
    description:
      "Silver-dollar eucalyptus, the florist's favourite filler. One generous bunch of 8–10 stems.",
    categorySlug: "raw-materials",
    subCategorySlug: "greenery",
    price: 450,
    stock: 60,
    isBestSeller: true,
    images: ["photo-1459156212016-c812468e2115"],
  },
  {
    name: "Kraft & Ivory Wrap Set",
    type: "RAW_MATERIAL",
    description:
      "Double-sided wrapping sheets (kraft outside, ivory inside) with 2 metres of satin ribbon.",
    categorySlug: "raw-materials",
    subCategorySlug: "wrapping-ribbons",
    price: 300,
    stock: 80,
    images: ["photo-1513201099705-a9746e1e201f"],
  },
  {
    name: "Ceramic Bud Vase",
    type: "RAW_MATERIAL",
    description:
      "A small matte-ceramic vase in warm stone. Holds a posy or three tall stems beautifully.",
    categorySlug: "raw-materials",
    subCategorySlug: "vases-boxes",
    price: 1200,
    salePrice: 950,
    stock: 25,
    images: ["photo-1578500494198-246f612d3b3d", "photo-1533616688419-b7a585564566"],
  },
  {
    name: "Floral Foam Brick (2-pack)",
    type: "RAW_MATERIAL",
    description:
      "Wet floral foam for arrangements — soak, trim, and build. Two bricks per pack.",
    categorySlug: "raw-materials",
    subCategorySlug: "foam-cards",
    price: 400,
    stock: 50,
    images: ["photo-1563241527-3004b7be0ffd"],
  },

  // --- Gift add-ons ---
  {
    name: "Artisan Chocolate Box",
    type: "ADDON",
    description:
      "Twelve handmade pralines in a ribboned gift box. Pairs perfectly with any bouquet.",
    categorySlug: "gift-addons",
    subCategorySlug: "chocolates",
    price: 1800,
    stock: 40,
    isBestSeller: true,
    images: ["photo-1549007994-cb92caebd54b", "photo-1511381939415-e44015466834"],
  },
  {
    name: "Dark Chocolate Bar Duo",
    type: "ADDON",
    description: "Two single-origin dark chocolate bars, 70% and 85%.",
    categorySlug: "gift-addons",
    subCategorySlug: "chocolates",
    price: 950,
    stock: 60,
    images: ["photo-1511381939415-e44015466834"],
  },
  {
    name: "Classic Teddy Bear",
    type: "ADDON",
    description:
      "A soft 30 cm teddy bear with a blush ribbon collar. The traditional plus-one for flowers.",
    categorySlug: "gift-addons",
    subCategorySlug: "teddy-bears",
    price: 1500,
    stock: 35,
    images: ["photo-1559454403-b8fb88521f11"],
  },
  {
    name: "Celebration Balloon Set",
    type: "ADDON",
    description:
      "Five helium-quality latex balloons in ivory, blush, and gold. Inflated on delivery day.",
    categorySlug: "gift-addons",
    subCategorySlug: "balloons",
    price: 600,
    stock: 70,
    isNewArrival: true,
    images: ["photo-1530103862676-de8c9debad1d"],
    tags: [["OCCASION", "Birthday"]],
  },
  {
    name: "Handwritten Greeting Card",
    type: "ADDON",
    description:
      "A thick cotton-paper card, handwritten by our team with your message.",
    categorySlug: "gift-addons",
    subCategorySlug: "cards",
    price: 350,
    stock: 100,
    images: ["photo-1587314168485-3236d6710814"],
  },
  {
    name: "Petite Gift Basket",
    type: "ADDON",
    description:
      "A small woven basket with chocolates, a candle, and a card — ready to gift.",
    categorySlug: "gift-addons",
    subCategorySlug: "chocolates",
    price: 2500,
    salePrice: 2100,
    stock: 15,
    images: ["photo-1591886960571-74d43a9d4166"],
  },
];

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

  // Products
  const subCategories = await prisma.subCategory.findMany({
    select: { id: true, slug: true, categoryId: true },
  });
  const subBySlug = new Map(subCategories.map((s) => [s.slug, s]));
  const allTags = await prisma.tag.findMany({ select: { id: true, slug: true } });
  const tagBySlug = new Map(allTags.map((t) => [t.slug, t.id]));

  for (const p of PRODUCTS) {
    const sub = subBySlug.get(p.subCategorySlug);
    if (!sub) throw new Error(`Unknown sub-category: ${p.subCategorySlug}`);
    const slug = slugify(p.name);

    const base = {
      name: p.name,
      type: p.type,
      description: p.description,
      price: p.price,
      salePrice: p.salePrice ?? null,
      stock: p.stock,
      isBestSeller: p.isBestSeller ?? false,
      isNewArrival: p.isNewArrival ?? false,
      isFeatured: p.isFeatured ?? false,
      categoryId: sub.categoryId,
      subCategoryId: sub.id,
    };

    const product = await prisma.product.upsert({
      where: { slug },
      update: base,
      create: { ...base, slug },
    });

    // Replace child rows wholesale so re-running the seed stays consistent.
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: p.images.map((id, index) => ({
        productId: product.id,
        url: img(id),
        alt: p.name,
        sortOrder: index,
      })),
    });

    await prisma.productVariant.deleteMany({ where: { productId: product.id } });
    if (p.variants?.length) {
      await prisma.productVariant.createMany({
        data: p.variants.map((v) => ({
          productId: product.id,
          name: v.name,
          price: v.price,
          stock: v.stock,
        })),
      });
    }

    await prisma.productTag.deleteMany({ where: { productId: product.id } });
    if (p.tags?.length) {
      const tagIds = p.tags
        .map(([kind, name]) => tagBySlug.get(tagSlug(kind, name)))
        .filter((id): id is string => !!id);
      await prisma.productTag.createMany({
        data: tagIds.map((tagId) => ({ productId: product.id, tagId })),
      });
    }
  }
  console.log(`Seeded ${PRODUCTS.length} products.`);

  // ---------------------------------------------------------------- Content
  // Editable homepage blocks (admin > Content). Update only creates missing
  // rows so a shopkeeper's edits survive re-seeding.
  const contentBlocks = [
    {
      key: "home.hero",
      kind: "HERO_SLIDE" as const,
      title: "Flowers that say it before you do",
      body: "Hand-tied bouquets for every occasion, individual stems for your own arrangements, and gifts to go with them.",
      imageUrl:
        "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=1200&q=80",
      isPublished: true,
    },
    {
      key: "announcement.main",
      kind: "ANNOUNCEMENT" as const,
      title: "Same-day preparation · Next-day delivery across Lahore",
      body: null,
      imageUrl: null,
      isPublished: true,
    },
  ];
  for (const block of contentBlocks) {
    await prisma.contentBlock.upsert({
      where: { key: block.key },
      update: {},
      create: block,
    });
  }
  console.log(`Seeded ${contentBlocks.length} content blocks.`);

  const counts = {
    products: await prisma.product.count(),
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
