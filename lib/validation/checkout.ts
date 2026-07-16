import { z } from "zod";
import { DELIVERY_TIME_SLOTS } from "@/lib/delivery";

// A cart line is either a catalog product or a previously saved custom bouquet.
export const checkoutItemSchema = z
  .object({
    productId: z.string().min(1).nullable().optional(),
    variantId: z.string().min(1).nullable().optional(),
    customBouquetId: z.string().min(1).nullable().optional(),
    quantity: z.number().int().min(1).max(99),
  })
  .refine(
    (item) => !!item.productId || !!item.customBouquetId,
    "Each cart item must be a product or a custom bouquet",
  );

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "Your cart is empty"),

  deliveryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a delivery date"),
  deliveryTimeSlot: z.enum(DELIVERY_TIME_SLOTS, {
    error: "Choose a delivery time",
  }),
  giftMessage: z.string().trim().max(500).optional().or(z.literal("")),

  recipientName: z.string().trim().min(2, "Recipient name is required").max(100),
  recipientPhone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, "Enter a valid phone number"),
  addressLine1: z.string().trim().min(5, "Street address is required").max(200),
  addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required").max(100),
  area: z.string().trim().max(100).optional().or(z.literal("")),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),

  guestEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),

  paymentMethod: z.literal("cod"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
