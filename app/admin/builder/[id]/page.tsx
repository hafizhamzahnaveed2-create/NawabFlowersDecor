import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBuilderComponent,
  listLinkableRawMaterials,
} from "@/lib/repositories/builder";
import { BuilderComponentForm } from "../component-form";
import { requirePagePermission } from "../../require-page-permission";

export const metadata = { title: "Edit builder component · Admin" };

export default async function EditBuilderComponentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePagePermission("builder.write");
  const { id } = await params;
  const [component, linkable] = await Promise.all([
    getBuilderComponent(id),
    listLinkableRawMaterials(id),
  ]);
  if (!component) notFound();

  return (
    <div>
      <Link
        href="/admin/builder"
        className="text-sm text-sage hover:text-burgundy"
      >
        ← Builder components
      </Link>
      <h1 className="mt-3 font-display text-3xl text-burgundy">
        Edit {component.name}
      </h1>
      <div className="mt-6">
        <BuilderComponentForm component={component} linkable={linkable} />
      </div>
    </div>
  );
}
