import { notFound } from "next/navigation";
import { createPage } from "@/app/actions";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
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
    <DashboardLayout
      title="Create a page"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: project.slug, href: `/projects/${project.slug}` },
        { label: "New Page" }
      ]}
      action={{ label: "New Page", href: `/projects/${project.slug}/pages/new` }}
    >
      <div className="space-y-6">
        <p className="text-neutral-700">Add a new page to the {project.name} project.</p>
        <PageCreateForm projectSlug={project.slug} action={createPageAction} />
      </div>
    </DashboardLayout>
  );
}
