import type { NextAuthConfig } from "next-auth";

// Edge-safe auth config: no Prisma imports. Used by middleware.
// The full config (adapter + credentials provider) lives in lib/auth.ts.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const user = auth?.user;

      if (pathname.startsWith("/admin")) {
        return user?.role === "ADMIN" || user?.role === "STAFF";
      }
      if (pathname.startsWith("/account")) {
        return !!user;
      }
      return true;
    },
  },
  providers: [], // filled in by lib/auth.ts
} satisfies NextAuthConfig;
