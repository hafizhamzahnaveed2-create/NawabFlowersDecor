"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";

type StaffRole = {
  id: string;
  name: string;
  description: string | null;
};

type StaffUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  profile: {
    id: string;
    isActive: boolean;
    staffRoleId: string | null;
    staffRoleName: string | null;
  } | null;
};

export function StaffManager({
  initialUsers,
  roles,
}: {
  initialUsers: StaffUser[];
  roles: StaffRole[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const selfId = session?.user?.id;
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const update = useMutation({
    mutationFn: async (body: {
      userId: string;
      staffRoleId?: string | null;
      isActive?: boolean;
      role?: "STAFF" | "ADMIN";
    }) => {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not update");
    },
    onSuccess: () => {
      setError(null);
      router.refresh();
    },
    onError: (e: Error) => setError(e.message),
  });

  const create = useMutation({
    mutationFn: async (body: {
      name: string;
      email: string;
      password: string;
      role: "STAFF" | "ADMIN";
      staffRoleId: string | null;
    }) => {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not create user");
      return data;
    },
    onSuccess: (_data, _vars, _ctx) => {
      setFormError(null);
      router.refresh();
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const remove = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(
        `/api/admin/staff?userId=${encodeURIComponent(userId)}`,
        { method: "DELETE" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not delete user");
    },
    onSuccess: () => {
      setError(null);
      router.refresh();
    },
    onError: (e: Error) => setError(e.message),
  });

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const form = event.currentTarget;
    const fd = new FormData(form);
    create.mutate(
      {
        name: String(fd.get("name") ?? ""),
        email: String(fd.get("email") ?? ""),
        password: String(fd.get("password") ?? ""),
        role: String(fd.get("role") ?? "STAFF") as "STAFF" | "ADMIN",
        staffRoleId: String(fd.get("staffRoleId") ?? "") || null,
      },
      {
        onSuccess: () => form.reset(),
      },
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-petal border border-stone bg-white p-5 sm:p-6">
        <h2 className="font-display text-xl text-burgundy">Add team member</h2>
        <p className="mt-1 text-sm text-ink/60">
          Create a staff or admin login. They can sign in at /login and open Shop
          admin.
        </p>
        <form
          onSubmit={handleCreate}
          className="mt-5 grid gap-4 sm:grid-cols-2"
          noValidate
        >
          <div>
            <Label htmlFor="staff-name">Name</Label>
            <Input id="staff-name" name="name" required autoComplete="name" />
          </div>
          <div>
            <Label htmlFor="staff-email">Email</Label>
            <Input
              id="staff-email"
              name="email"
              type="email"
              required
              autoComplete="off"
            />
          </div>
          <div>
            <Label htmlFor="staff-password">Temporary password</Label>
            <Input
              id="staff-password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="staff-account-role">Account type</Label>
            <select
              id="staff-account-role"
              name="role"
              defaultValue="STAFF"
              className="mt-1.5 w-full rounded-lg border border-stone bg-white px-3.5 py-2.5 text-sm"
            >
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="staff-role">Permission role</Label>
            <select
              id="staff-role"
              name="staffRoleId"
              defaultValue=""
              className="mt-1.5 w-full rounded-lg border border-stone bg-white px-3.5 py-2.5 text-sm"
            >
              <option value="">
                None yet (admins without a role get full access)
              </option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.description ? ` — ${r.description}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <FieldError message={formError ?? undefined} />
            <Button type="submit" disabled={create.isPending} className="mt-2">
              {create.isPending ? "Creating…" : "Create user"}
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-display text-xl text-burgundy">Team members</h2>
        <p className="mt-1 text-sm text-ink/60">
          Block stops admin sign-in. Delete removes the account permanently.
        </p>
        <FieldError message={error ?? undefined} />
        <div className="mt-4 overflow-x-auto rounded-petal border border-stone bg-white">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-stone text-left text-xs uppercase tracking-wider text-ink/50">
                <th className="px-4 py-3">Team member</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Permissions</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone">
              {initialUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-ink/50"
                  >
                    No staff accounts yet — create one above.
                  </td>
                </tr>
              ) : (
                initialUsers.map((u) => {
                  const isSelf = u.id === selfId;
                  const isActive = u.profile?.isActive ?? true;
                  return (
                    <tr key={u.id} className="hover:bg-ivory/60">
                      <td className="px-4 py-3">
                        <p className="font-medium">
                          {u.name ?? u.email}
                          {isSelf ? (
                            <span className="ml-2 text-xs font-normal text-ink/40">
                              (you)
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-ink/50">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="w-full max-w-[8rem] rounded-lg border border-stone bg-white px-2.5 py-2 text-sm"
                          value={u.role}
                          disabled={update.isPending || isSelf}
                          onChange={(e) => {
                            update.mutate({
                              userId: u.id,
                              role: e.target.value as "STAFF" | "ADMIN",
                            });
                          }}
                        >
                          <option value="STAFF">Staff</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="w-full max-w-[14rem] rounded-lg border border-stone bg-white px-2.5 py-2 text-sm"
                          value={u.profile?.staffRoleId ?? ""}
                          disabled={update.isPending}
                          onChange={(e) => {
                            update.mutate({
                              userId: u.id,
                              staffRoleId: e.target.value || null,
                            });
                          }}
                        >
                          <option value="">No permission role</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            isActive
                              ? "rounded-full bg-sage/15 px-2.5 py-1 text-xs font-medium text-sage"
                              : "rounded-full bg-stone px-2.5 py-1 text-xs font-medium text-ink/50"
                          }
                        >
                          {isActive ? "Active" : "Blocked"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={update.isPending || isSelf}
                            onClick={() => {
                              update.mutate({
                                userId: u.id,
                                isActive: !isActive,
                              });
                            }}
                          >
                            {isActive ? "Block" : "Unblock"}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={remove.isPending || isSelf}
                            onClick={() => {
                              const label = u.name ?? u.email;
                              if (
                                !window.confirm(
                                  `Delete ${label}? They will no longer be able to sign in. This cannot be undone.`,
                                )
                              ) {
                                return;
                              }
                              remove.mutate(u.id);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-ink/50">
          Permission changes apply on the next sign-in. You cannot block or
          delete your own account, and the shop always keeps at least one active
          admin.
        </p>
      </section>
    </div>
  );
}
