import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation/auth";
import { loadStaffPermissions } from "@/lib/staff-permissions";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        if (user.role === "ADMIN" || user.role === "STAFF") {
          const profile = await prisma.staffProfile.findUnique({
            where: { userId: user.id },
            select: { isActive: true },
          });
          if (profile && !profile.isActive) return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
      }
      if (token.id && (token.role === "ADMIN" || token.role === "STAFF")) {
        token.permissions = await loadStaffPermissions(
          token.id as string,
          token.role,
        );
      } else if (token.role) {
        token.permissions = [];
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.permissions = token.permissions ?? [];
      }
      return session;
    },
  },
});
