import Link from "next/link";
import { listLinkableRawMaterials } from "@/lib/repositories/builder";
import { BuilderComponentForm } from "../component-form";
import { requirePagePermission } from "../../require-page-permission";

export const metadata = { title: "Add builder component · Admin" };

export default async function NewBuilderComponentPage() {
  await requirePagePermission("builder.write");
  const linkable = await listLinkableRawMaterials();

  return (
    <div>
      <Link
        href="/admin/builder"
        className="text-sm text-sage hover:text-burgundy"
      >
        ← Builder components
      </Link>
      <h1 className="mt-3 font-display text-3xl text-burgundy">
        Add builder component
      </h1>
      <div className="mt-6">
        <BuilderComponentForm linkable={linkable} />
      </div>
    </div>
  );
}
