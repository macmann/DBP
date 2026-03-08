"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { BuildJobStatus, PageStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { callOpenAIForPageSchema } from "@/lib/ai/openaiClient";
import { buildPageGenerationPrompts } from "@/lib/ai/promptBuilder";
import {
  ALLOWED_SECTION_TYPES,
  type GeneratedPageSchema,
  validateGeneratedPageSchema,
} from "@/lib/ai/schema";
import { slugify } from "@/lib/utils/slugify";

async function ensureUniqueProjectSlug(baseSlug: string) {
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.project.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

async function ensureUniquePageSlug(projectId: string, baseSlug: string, excludePageId?: string) {
  let slug = baseSlug;
  let suffix = 1;

  while (
    await prisma.page.findFirst({
      where: {
        projectId,
        slug,
        ...(excludePageId
          ? {
              id: {
                not: excludePageId,
              },
            }
          : {}),
      },
      select: { id: true },
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function parseReferenceLinks(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export type UpdatePageState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: {
    title?: string;
    slug?: string;
    referenceLinks?: string;
  };
};

export const initialUpdatePageState: UpdatePageState = {
  status: "idle",
  message: "",
};

export type BuildPageResult =
  | {
      status: "success";
      message: string;
      versionId: string;
      versionNumber: number;
      sectionCount: number;
    }
  | {
      status: "error";
      message: string;
      context?: Record<string, unknown>;
    };

function parseReferenceLinksFromForm(formData: FormData) {
  return formData
    .getAll("referenceLinks")
    .map((value) => String(value).trim())
    .filter(Boolean);
}

function isValidReferenceUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    throw new Error("Project name is required");
  }

  const baseSlug = slugify(name) || "project";
  const slug = await ensureUniqueProjectSlug(baseSlug);

  const project = await prisma.project.create({
    data: {
      name,
      slug,
    },
    select: {
      slug: true,
    },
  });

  redirect(`/projects/${project.slug}`);
}

export async function createPage(projectSlug: string, formData: FormData) {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true, slug: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const title = String(formData.get("title") ?? "").trim();
  const customSlug = String(formData.get("slug") ?? "").trim();
  const prompt = String(formData.get("prompt") ?? "").trim();
  const referenceLinksInput = String(formData.get("referenceLinks") ?? "");

  if (!title) {
    throw new Error("Page title is required");
  }

  const baseSlug = slugify(customSlug || title) || "page";
  const slug = await ensureUniquePageSlug(project.id, baseSlug);
  const referenceLinks = parseReferenceLinks(referenceLinksInput);

  const page = await prisma.$transaction(async (tx) => {
    const createdPage = await tx.page.create({
      data: {
        projectId: project.id,
        title,
        slug,
        prompt: prompt || null,
        referenceLinks,
        status: PageStatus.draft,
      },
      select: {
        id: true,
      },
    });

    const createdVersion = await tx.pageVersion.create({
      data: {
        pageId: createdPage.id,
        versionNumber: 1,
        instructionPrompt: prompt || null,
        generatedSchemaJson: Prisma.JsonNull,
        notes: "Initial draft version",
      },
      select: {
        id: true,
      },
    });

    return tx.page.update({
      where: { id: createdPage.id },
      data: {
        currentVersionId: createdVersion.id,
      },
      select: {
        id: true,
      },
    });
  });

  redirect(`/projects/${project.slug}/pages/${page.id}`);
}

export async function updatePage(
  projectSlug: string,
  pageId: string,
  _previousState: UpdatePageState,
  formData: FormData,
): Promise<UpdatePageState> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });

  if (!project) {
    return {
      status: "error",
      message: "Project not found.",
    };
  }

  const existingPage = await prisma.page.findFirst({
    where: {
      id: pageId,
      projectId: project.id,
    },
    select: {
      id: true,
      currentVersionId: true,
    },
  });

  if (!existingPage) {
    return {
      status: "error",
      message: "Page not found.",
    };
  }

  const title = String(formData.get("title") ?? "").trim();
  const customSlug = String(formData.get("slug") ?? "").trim();
  const prompt = String(formData.get("prompt") ?? "").trim();
  const referenceLinks = parseReferenceLinksFromForm(formData);

  if (!title) {
    return {
      status: "error",
      message: "Could not save changes.",
      fieldErrors: {
        title: "Page title is required.",
      },
    };
  }

  if (referenceLinks.some((link) => !isValidReferenceUrl(link))) {
    return {
      status: "error",
      message: "Could not save changes.",
      fieldErrors: {
        referenceLinks: "Reference links must be valid http(s) URLs.",
      },
    };
  }

  const baseSlug = slugify(customSlug || title) || "page";
  const slug = await ensureUniquePageSlug(project.id, baseSlug, pageId);

  await prisma.$transaction(async (tx) => {
    await tx.page.update({
      where: {
        id: pageId,
      },
      data: {
        title,
        slug,
        prompt: prompt || null,
        referenceLinks,
      },
    });

    if (existingPage.currentVersionId) {
      await tx.pageVersion.update({
        where: {
          id: existingPage.currentVersionId,
        },
        data: {
          instructionPrompt: prompt || null,
        },
      });
    }
  });

  revalidatePath(`/projects/${projectSlug}/pages/${pageId}`);
  revalidatePath(`/projects/${projectSlug}`);

  return {
    status: "success",
    message: "Page updated successfully.",
  };
}

export async function buildPage(projectSlug: string, pageId: string): Promise<BuildPageResult> {
  const page = await prisma.page.findFirst({
    where: {
      id: pageId,
      project: {
        slug: projectSlug,
      },
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      assets: {
        where: {
          pageId,
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
      },
    },
  });

  if (!page) {
    return {
      status: "error",
      message: "Page not found.",
    };
  }

  const buildJob = await prisma.buildJob.create({
    data: {
      projectId: page.project.id,
      pageId: page.id,
      status: BuildJobStatus.queued,
    },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.buildJob.update({
      where: { id: buildJob.id },
      data: {
        status: BuildJobStatus.running,
        startedAt: new Date(),
      },
    });

    await tx.page.update({
      where: { id: page.id },
      data: {
        status: PageStatus.generating,
      },
    });
  });

  try {
    const prompts = buildPageGenerationPrompts({
      pagePrompt: page.prompt ?? "",
      referenceLinks: Array.isArray(page.referenceLinks)
        ? page.referenceLinks.filter((link): link is string => typeof link === "string")
        : [],
      assets: page.assets,
      allowedSections: ALLOWED_SECTION_TYPES,
      toneBrandingHints: [
        `Use ${page.project.name} brand voice where possible.`,
        "Prefer concise, conversion-oriented marketing copy.",
      ],
    });

    const aiOutput = await callOpenAIForPageSchema(prompts);
    const parsed = validateGeneratedPageSchema(aiOutput.json);

    if (!parsed.success) {
      const conciseValidationError = parsed.errors[0] ?? "Schema validation failed.";
      const context = {
        reason: "schema_validation_failed",
        error: conciseValidationError,
        requestId: aiOutput.requestId,
      };

      await prisma.$transaction(async (tx) => {
        await tx.page.update({
          where: { id: page.id },
          data: {
            status: PageStatus.failed,
            lastError: JSON.stringify(context),
          },
        });

        await tx.buildJob.update({
          where: { id: buildJob.id },
          data: {
            status: BuildJobStatus.failed,
            finishedAt: new Date(),
            errorMessage: conciseValidationError,
          },
        });
      });

      revalidatePath(`/projects/${projectSlug}/pages/${pageId}`);

      return {
        status: "error",
        message: "Generated output did not pass schema validation.",
        context,
      };
    }

    const savedVersion = await prisma.$transaction(async (tx) => {
      const latestVersion = await tx.pageVersion.findFirst({
        where: {
          pageId: page.id,
        },
        orderBy: {
          versionNumber: "desc",
        },
        select: {
          versionNumber: true,
        },
      });

      const version = await tx.pageVersion.create({
        data: {
          pageId: page.id,
          versionNumber: (latestVersion?.versionNumber ?? 0) + 1,
          instructionPrompt: page.prompt,
          generatedSchemaJson: parsed.data as unknown as Prisma.InputJsonValue,
          notes: "Generated via Build action.",
        },
        select: {
          id: true,
          versionNumber: true,
        },
      });

      await tx.page.update({
        where: {
          id: page.id,
        },
        data: {
          currentVersionId: version.id,
          status: PageStatus.published,
          lastError: null,
          content: JSON.stringify(parsed.data),
          publishedAt: new Date(),
        },
      });

      await tx.buildJob.update({
        where: { id: buildJob.id },
        data: {
          versionId: version.id,
          status: BuildJobStatus.completed,
          finishedAt: new Date(),
        },
      });

      return version;
    });

    revalidatePath(`/projects/${projectSlug}/pages/${pageId}`);
    revalidatePath(`/projects/${projectSlug}`);

    return {
      status: "success",
      message: "Build completed and new page version saved.",
      versionId: savedVersion.id,
      versionNumber: savedVersion.versionNumber,
      sectionCount: (parsed.data as GeneratedPageSchema).sections.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const context = {
      reason: "build_failed",
      error: errorMessage,
    };

    await prisma.$transaction(async (tx) => {
      await tx.page.update({
        where: { id: page.id },
        data: {
          status: PageStatus.failed,
          lastError: JSON.stringify({ reason: context.reason, error: errorMessage }),
        },
      });

      await tx.buildJob.update({
        where: { id: buildJob.id },
        data: {
          status: BuildJobStatus.failed,
          finishedAt: new Date(),
          errorMessage: errorMessage,
        },
      });
    });

    revalidatePath(`/projects/${projectSlug}/pages/${pageId}`);

    return {
      status: "error",
      message: "Build failed.",
      context,
    };
  }
}
