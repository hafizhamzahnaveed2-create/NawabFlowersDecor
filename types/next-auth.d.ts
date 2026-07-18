import type { DefaultSession } from "next-auth";
import type {} from "next-auth/jwt";
import type { UserRole } from "@/lib/generated/prisma/client";
import type { PermissionKey } from "@/lib/permissions";

declare module "next-auth" {
  interface User {
    role: UserRole;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      permissions: PermissionKey[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    permissions?: PermissionKey[];
  }
}
