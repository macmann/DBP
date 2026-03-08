import Link from "next/link";
import { notFound } from "next/navigation";
import { createPage } from "@/app/actions";
import { PageCreateForm } from "@/components/forms/PageCreateForm";
import { prisma } from "@/lib/db";

export default async function NewProjectPage({ params }: { params: Promise<{ projectSlug: string }> }) {
  const { projectSlug } = await params;

  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: {
      id: true,
      slug: true,
      name: true
    }
  });

  if (!project) {
    notFound();
  }

  const createPageAction = createPage.bind(null, project.slug);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link href={`/projects/${project.slug}`} className="text-sm text-neutral-500 hover:text-neutral-700">
          ← Back to {project.name}
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Create a page</h1>
        <p className="text-neutral-700">Add a new page to the {project.name} project.</p>
      </div>

      <PageCreateForm projectSlug={project.slug} action={createPageAction} />
    </div>
  );
}
