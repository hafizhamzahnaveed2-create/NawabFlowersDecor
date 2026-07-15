import type { DefaultSession } from "next-auth";
// Importing the module is required for the JWT augmentation below to merge.
import type {} from "next-auth/jwt";
import type { UserRole } from "@/lib/generated/prisma/client";

declare module "next-auth" {
  interface User {
    role: UserRole;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
