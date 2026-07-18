import { z } from "zod";

export const createStaffUserSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters"),
    role: z.enum(["STAFF", "ADMIN"]),
    staffRoleId: z.string().min(1).nullable().optional(),
    isActive: z.boolean().optional().default(true),
  })
  .refine(
    (data) => data.role === "ADMIN" || !!data.staffRoleId,
    {
      message: "Staff accounts need a permission role",
      path: ["staffRoleId"],
    },
  );

export const updateStaffUserSchema = z.object({
  userId: z.string().min(1),
  staffRoleId: z.string().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
  role: z.enum(["STAFF", "ADMIN"]).optional(),
});

export type CreateStaffUserInput = z.infer<typeof createStaffUserSchema>;
export type UpdateStaffUserInput = z.infer<typeof updateStaffUserSchema>;
