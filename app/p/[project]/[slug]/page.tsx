import { notFound, redirect } from "next/navigation";
import { ENABLE_PROJECT_PUBLIC_PATHS, buildCanonicalPublicPath } from "@/lib/config/publishing";
import { getPublishedDemoPage } from "@/lib/public-pages";

type ProjectScopedDemoPageProps = {
  params: Promise<{ project: string; slug: string }>;
};

export default async function ProjectScopedDemoPage({ params }: ProjectScopedDemoPageProps) {
  if (!ENABLE_PROJECT_PUBLIC_PATHS) {
    notFound();
  }

  const { project, slug } = await params;
  const page = await getPublishedDemoPage({
    projectSlug: project,
    publicSlug: slug,
  });

  if (!page) {
    notFound();
  }

  redirect(buildCanonicalPublicPath(page.publicSlug));
}
