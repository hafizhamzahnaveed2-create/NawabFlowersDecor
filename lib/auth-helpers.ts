import { auth } from "@/lib/auth";

/**
 * Session guard for admin API routes. Middleware already protects /admin
 * pages; API routes verify independently so they can't be called directly.
 */
export async function requireStaff() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "STAFF")) {
    return null;
  }
  return session;
}
