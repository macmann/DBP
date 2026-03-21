import { prisma } from "@/lib/db";

export async function getPublishedDemoPage(input: { publicSlug: string; projectSlug?: string }) {
  const page = await prisma.page.findFirst({
    where: {
      publicSlug: input.publicSlug,
      status: "published",
      ...(input.projectSlug
        ? {
            project: {
              slug: input.projectSlug,
            },
          }
        : {}),
    },
    select: {
      id: true,
      publicSlug: true,
      title: true,
      currentVersion: {
        select: {
          generatedSchemaJson: true,
        },
      },
      project: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (!page) {
    return null;
  }

  const assets = await prisma.asset.findMany({
    where: {
      pageId: page.id,
    },
    orderBy: {
      sortOrder: "asc",
    },
    select: {
      id: true,
      type: true,
      storageUrl: true,
      metadata: true,
      fileName: true,
      mimeType: true,
    },
  });

  return {
    ...page,
    assets,
  };
}
