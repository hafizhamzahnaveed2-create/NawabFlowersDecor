import { requirePagePermission } from "../require-page-permission";
import { listActivity } from "@/lib/repositories/admin/activity";

export const metadata = { title: "Activity · Admin" };

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  }).format(new Date(iso));
}

export default async function AdminActivityPage() {
  await requirePagePermission("activity.read");
  const rows = await listActivity(100);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl text-burgundy">Activity</h1>
      <p className="mt-1 text-ink/60">
        Recent changes across the shop — who did what, and when.
      </p>

      <div className="mt-6 overflow-hidden rounded-petal border border-stone bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone text-left text-xs uppercase tracking-wider text-ink/50">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink/50">
                  No activity recorded yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-ivory/60">
                  <td className="whitespace-nowrap px-4 py-3 text-ink/70">
                    {formatWhen(row.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-medium">{row.action}</td>
                  <td className="px-4 py-3 text-ink/70">
                    {row.entityType}
                    {row.entityId ? (
                      <span className="ml-1 text-xs text-ink/40">
                        {row.entityId.slice(0, 8)}…
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {row.actorName ?? row.actorEmail ?? (
                      <span className="text-ink/40">System</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
