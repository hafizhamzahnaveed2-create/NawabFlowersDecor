import { requirePagePermission } from "../require-page-permission";
import {
  listStaffRoles,
  listStaffUsers,
} from "@/lib/repositories/admin/staff";
import { StaffManager } from "./staff-manager";

export const metadata = { title: "Staff · Admin" };

export default async function AdminStaffPage() {
  await requirePagePermission("staff.manage");
  const [users, roles] = await Promise.all([listStaffUsers(), listStaffRoles()]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl text-burgundy">Staff</h1>
      <p className="mt-1 text-ink/60">
        Create, block, and delete team logins — and assign what each person can
        manage in the shop.
      </p>
      <div className="mt-6">
        <StaffManager initialUsers={users} roles={roles} />
      </div>
    </div>
  );
}
