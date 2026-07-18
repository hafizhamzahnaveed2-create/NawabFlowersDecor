import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Providers } from "@/app/providers";
import { TabSessionGate } from "@/components/auth/tab-session-gate";
import { WelcomeSplash } from "@/components/welcome/welcome-splash";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata = { title: "Admin" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "STAFF")) {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <Providers>
      <TabSessionGate callbackPath="/admin">
        <WelcomeSplash greeting="Welcome to your shop admin" />
        <AdminShell
          email={session.user.email ?? ""}
          permissions={session.user.permissions ?? []}
        >
          {children}
        </AdminShell>
      </TabSessionGate>
    </Providers>
  );
}
