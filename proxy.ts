import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge proxy (Next 16's middleware convention) uses the Prisma-free config;
// route protection rules live in authConfig.callbacks.authorized
// (/admin -> STAFF/ADMIN, /account -> any signed-in user).
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
