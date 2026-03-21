"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { BuildJobStatus, PageStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { callOpenAIForPageSchema } from "@/lib/ai/openaiClient";
import { applyAssetFallbacks } from "@/lib/ai/applyAssetFallbacks";
import { buildPageGenerationPrompts } from "@/lib/ai/promptBuilder";
import {
  ALLOWED_SECTION_TYPES,
  type GeneratedPageSchema,
  validateGeneratedPageSchema,
} from "@/lib/ai/schema";
import { slugify } from "@/lib/utils/slugify";
import {
  PUBLIC_SLUG_CONSTRAINTS,
  RESERVED_PUBLIC_SLUGS,
  getPublicPathsToRevalidate,
} from "@/lib/config/publishing";
import {
  hasPageFieldErrors,
  parseReferenceLinks,
  parseReferenceLinksFromForm,
  validatePageInput,
  type PageFieldErrors,
} from "@/lib/validation/page";

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


function normalizePublicSlug(baseSlug: string) {
  const normalized = baseSlug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const fallbackSlug = normalized || "page";

  if (!PUBLIC_SLUG_CONSTRAINTS.pattern.test(fallbackSlug)) {
    throw new Error("Public slug must contain only lowercase letters, numbers, and single hyphens.");
  }

  if (fallbackSlug.length < PUBLIC_SLUG_CONSTRAINTS.minLength) {
    throw new Error(`Public slug must be at least ${PUBLIC_SLUG_CONSTRAINTS.minLength} characters.`);
  }

  if (fallbackSlug.length > PUBLIC_SLUG_CONSTRAINTS.maxLength) {
    return fallbackSlug.slice(0, PUBLIC_SLUG_CONSTRAINTS.maxLength).replace(/-+$/g, "");
  }

  return fallbackSlug;
}

async function ensureUniquePublicSlug(baseSlug: string, excludePageId?: string) {
  const normalizedBaseSlug = normalizePublicSlug(baseSlug);
  const startingSlug = RESERVED_PUBLIC_SLUGS.has(normalizedBaseSlug)
    ? `${normalizedBaseSlug}-page`
    : normalizedBaseSlug;
  let publicSlug = startingSlug;
  let suffix = 1;

  while (
    RESERVED_PUBLIC_SLUGS.has(publicSlug) ||
    await prisma.page.findFirst({
      where: {
        publicSlug,
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
    suffix += 1;
    const suffixText = `-${suffix}`;
    const maxBaseLength = PUBLIC_SLUG_CONSTRAINTS.maxLength - suffixText.length;
    const trimmedBase = startingSlug.slice(0, maxBaseLength).replace(/-+$/g, "") || "page";
    publicSlug = `${trimmedBase}${suffixText}`;
  }

  return publicSlug;
}

function revalidateProjectAndPublicPaths(input: {
  projectSlug: string;
  pageId: string;
  currentPublicSlug: string;
  previousPublicSlug?: string | null;
}) {
  revalidatePath(`/projects/${input.projectSlug}/pages/${input.pageId}`);
  revalidatePath(`/projects/${input.projectSlug}`);
  for (const path of getPublicPathsToRevalidate({
    projectSlug: input.projectSlug,
    currentPublicSlug: input.currentPublicSlug,
    previousPublicSlug: input.previousPublicSlug,
  })) {
    revalidatePath(path);
  }
}

export type CreateProjectState = {
  ok: boolean;
  formError?: string;
  fieldErrors?: {
    name?: string;
  };
};

export type CreatePageState = {
  ok: boolean;
  formError?: string;
  fieldErrors?: PageFieldErrors;
};

export type UpdatePageState = {
  status: "idle" | "success" | "error";
  ok: boolean;
  message: string;
  fieldErrors?: PageFieldErrors;
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
      code: "invalid_prompt" | "missing_api_key" | "generation_failure";
      message: string;
    };

export type QuickGenerateState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: {
    projectName?: string;
    pageName?: string;
    prompt?: string;
  };
  publicSlug?: string;
  projectSlug?: string;
  pageId?: string;
};

function mapBuildFailure(errorMessage: string): {
  code: "invalid_prompt" | "missing_api_key" | "generation_failure";
  message: string;
} {
  if (errorMessage.includes("OPENAI_API_KEY is not configured")) {
    return {
      code: "missing_api_key",
      message:
        "Missing API key. Configure OPENAI_API_KEY before generating pages.",
    };
  }

  if (
    errorMessage.includes("OpenAI request failed (400)") ||
    errorMessage.includes("OpenAI request failed (422)") ||
    errorMessage.includes("schema validation")
  ) {
    return {
      code: "invalid_prompt",
      message:
        "Your prompt could not be processed. Try a clearer request with specific goals, audience, and offer details.",
    };
  }

  return {
    code: "generation_failure",
    message: "Generation failed. Please try again in a moment.",
  };
}

export type GenerateNewVersionResult =
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
    };

export type RollbackVersionResult =
  | {
      status: "success";
      message: string;
      versionId: string;
      versionNumber: number;
    }
  | {
      status: "error";
      message: string;
    };

export async function deletePage(projectSlug: string, pageId: string): Promise<{
  status: "success" | "error";
  message: string;
}> {
  try {
    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        project: {
          slug: projectSlug,
        },
      },
      select: {
        publicSlug: true,
      },
    });

    if (!page) {
      return {
        status: "error",
        message: "Page not found.",
      };
    }

    await prisma.page.delete({
      where: {
        id: pageId,
      },
    });

    revalidatePath(`/projects/${projectSlug}`);
    for (const path of getPublicPathsToRevalidate({
      projectSlug,
      currentPublicSlug: page.publicSlug,
    })) {
      revalidatePath(path);
    }

    return {
      status: "success",
      message: "Page deleted.",
    };
  } catch (error) {
    console.error("deletePage failed", { projectSlug, pageId, error });
    return {
      status: "error",
      message: "Could not delete this page right now.",
    };
  }
}

export async function createProject(
  _previousState: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return {
      ok: false,
      fieldErrors: {
        name: "Project name is required.",
      },
      formError: "Could not create project.",
    };
  }

  try {
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
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("createProject failed", { name, error });
    return {
      ok: false,
      formError: "Something went wrong while creating the project. Please try again.",
    };
  }
}

export async function createPage(
  projectSlug: string,
  _previousState: CreatePageState,
  formData: FormData,
): Promise<CreatePageState> {
  const title = String(formData.get("title") ?? "").trim();
  const customSlug = String(formData.get("slug") ?? "").trim();
  const prompt = String(formData.get("prompt") ?? "").trim();
  const referenceLinks = parseReferenceLinks(String(formData.get("referenceLinks") ?? ""));
  const validationErrors = validatePageInput({
    title,
    slug: customSlug,
    prompt,
    referenceLinks,
  });

  if (hasPageFieldErrors(validationErrors)) {
    return {
      ok: false,
      fieldErrors: validationErrors,
      formError: "Could not create page.",
    };
  }

  try {
    const project = await prisma.project.findUnique({
      where: { slug: projectSlug },
      select: { id: true, slug: true },
    });

    if (!project) {
      return {
        ok: false,
        formError: "Project not found.",
      };
    }

    const baseSlug = slugify(customSlug || title) || "page";
    const slug = await ensureUniquePageSlug(project.id, baseSlug);
    const publicSlug = await ensureUniquePublicSlug(baseSlug);

    const page = await prisma.$transaction(async (tx) => {
      const createdPage = await tx.page.create({
        data: {
          projectId: project.id,
          title,
          slug,
          prompt: prompt || null,
          referenceLinks,
          status: PageStatus.draft,
          publicSlug,
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
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("createPage failed", { projectSlug, title, customSlug, error });
    return {
      ok: false,
      formError: "Something went wrong while creating the page. Please try again.",
    };
  }
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
      ok: false,
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
      publicSlug: true,
    },
  });

  if (!existingPage) {
    return {
      status: "error",
      ok: false,
      message: "Page not found.",
    };
  }

  const title = String(formData.get("title") ?? "").trim();
  const customSlug = String(formData.get("slug") ?? "").trim();
  const prompt = String(formData.get("prompt") ?? "").trim();
  const referenceLinks = parseReferenceLinksFromForm(formData);
  const validationErrors = validatePageInput({
    title,
    slug: customSlug,
    prompt,
    referenceLinks,
  });

  if (hasPageFieldErrors(validationErrors)) {
    return {
      status: "error",
      ok: false,
      message: "Could not save changes.",
      fieldErrors: validationErrors,
    };
  }

  try {
    const baseSlug = slugify(customSlug || title) || "page";
    const slug = await ensureUniquePageSlug(project.id, baseSlug, pageId);
    const publicSlug = await ensureUniquePublicSlug(baseSlug, pageId);

    await prisma.$transaction(async (tx) => {
      await tx.page.update({
        where: {
          id: pageId,
        },
        data: {
          title,
          slug,
          prompt: prompt || null,
          referenceLinks: referenceLinks.filter(Boolean),
          publicSlug,
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

    revalidateProjectAndPublicPaths({
      projectSlug,
      pageId,
      currentPublicSlug: publicSlug,
      previousPublicSlug: existingPage.publicSlug,
    });

    return {
      status: "success",
      ok: true,
      message: "Page updated successfully.",
    };
  } catch (error) {
    console.error("updatePage failed", { projectSlug, pageId, error });
    return {
      status: "error",
      ok: false,
      message: "Could not save changes due to an internal error. Please try again.",
    };
  }
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
      code: "generation_failure",
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
      const themeOrSeoErrors = parsed.errors.filter(
        (error) => error.startsWith("theme") || error.startsWith("seo"),
      );
      const hasThemeOrSeoValidationFailure = themeOrSeoErrors.length > 0;
      const conciseValidationError = parsed.errors[0] ?? "Schema validation failed.";
      const context = {
        reason: hasThemeOrSeoValidationFailure
          ? "invalid_theme_or_seo"
          : "schema_validation_failed",
        error: conciseValidationError,
        themeOrSeoErrors,
        requestId: aiOutput.requestId,
      };
      console.error("buildPage schema validation failed", {
        projectSlug,
        pageId,
        ...context,
      });

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

      revalidateProjectAndPublicPaths({
        projectSlug,
        pageId,
        currentPublicSlug: page.publicSlug,
      });

      return {
        status: "error",
        code: "invalid_prompt",
        message: hasThemeOrSeoValidationFailure
          ? `Build failed because generated output has invalid theme/SEO data (${themeOrSeoErrors.join("; ")}). Review your prompt and try again.`
          : "Generated output did not pass schema validation. Review your prompt and assets, then try again.",
      };
    }

    const generatedSchema: GeneratedPageSchema = applyAssetFallbacks(parsed.data, page.assets);

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
          generatedSchemaJson: generatedSchema as unknown as Prisma.InputJsonValue,
          notes: "Generated via Build action.",
        },
        select: {
          id: true,
          versionNumber: true,
        },
      });

      const updatedPage = await tx.page.update({
        where: {
          id: page.id,
        },
        data: {
          currentVersionId: version.id,
          status: PageStatus.published,
          lastError: null,
          content: JSON.stringify(generatedSchema),
          publishedAt: new Date(),
        },
        select: {
          publicSlug: true,
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

      return {
        ...version,
        publicSlug: updatedPage.publicSlug,
      };
    });

    revalidateProjectAndPublicPaths({
      projectSlug,
      pageId,
      currentPublicSlug: savedVersion.publicSlug,
    });

    return {
      status: "success",
      message: "Build completed and new page version saved.",
      versionId: savedVersion.id,
      versionNumber: savedVersion.versionNumber,
      sectionCount: generatedSchema.sections.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const context = {
      reason: "build_failed",
      error: errorMessage,
    };
    console.error("buildPage failed", { projectSlug, pageId, ...context, error });

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

    revalidateProjectAndPublicPaths({
      projectSlug,
      pageId,
      currentPublicSlug: page.publicSlug,
    });

    return {
      status: "error",
      ...mapBuildFailure(errorMessage),
    };
  }
}

export async function quickGeneratePage(
  _previousState: QuickGenerateState,
  formData: FormData,
): Promise<QuickGenerateState> {
  const projectName = String(formData.get("projectName") ?? "").trim();
  const pageName = String(formData.get("pageName") ?? "").trim();
  const prompt = String(formData.get("prompt") ?? "").trim();

  const fieldErrors: QuickGenerateState["fieldErrors"] = {};

  if (!projectName) {
    fieldErrors.projectName = "Project name is required.";
  }

  if (!pageName) {
    fieldErrors.pageName = "Page name is required.";
  }

  if (!prompt) {
    fieldErrors.prompt = "Prompt is required.";
  }

  if (prompt.length > 6000) {
    fieldErrors.prompt = "Prompt must be 6000 characters or fewer.";
  }

  if (Object.values(fieldErrors).some(Boolean)) {
    return {
      status: "error",
      message: "Please fix the highlighted fields and try again.",
      fieldErrors,
    };
  }

  try {
    const existingProject = await prisma.project.findFirst({
      where: {
        name: {
          equals: projectName,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        slug: true,
      },
    });

    const project =
      existingProject ??
      (await prisma.project.create({
        data: {
          name: projectName,
          slug: await ensureUniqueProjectSlug(slugify(projectName) || "project"),
        },
        select: {
          id: true,
          slug: true,
        },
      }));

    const baseSlug = slugify(pageName) || "page";
    const pageSlug = await ensureUniquePageSlug(project.id, baseSlug);
    const publicSlug = await ensureUniquePublicSlug(baseSlug);

    const page = await prisma.$transaction(async (tx) => {
      const createdPage = await tx.page.create({
        data: {
          projectId: project.id,
          title: pageName,
          slug: pageSlug,
          prompt,
          referenceLinks: [],
          status: PageStatus.draft,
          publicSlug,
        },
        select: {
          id: true,
        },
      });

      const version = await tx.pageVersion.create({
        data: {
          pageId: createdPage.id,
          versionNumber: 1,
          instructionPrompt: prompt,
          generatedSchemaJson: Prisma.JsonNull,
          notes: "Initial quick-start version",
        },
        select: {
          id: true,
        },
      });

      return tx.page.update({
        where: {
          id: createdPage.id,
        },
        data: {
          currentVersionId: version.id,
        },
        select: {
          id: true,
          publicSlug: true,
        },
      });
    });

    const buildResult = await buildPage(project.slug, page.id);

    if (buildResult.status === "error") {
      return {
        status: "error",
        message: buildResult.message,
      };
    }

    return {
      status: "success",
      message: "Page generated successfully.",
      publicSlug: page.publicSlug,
      projectSlug: project.slug,
      pageId: page.id,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2021" &&
      error.meta?.table === "public.Project"
    ) {
      return {
        status: "error",
        message:
          "Database is not initialized yet. Run `npm run db:migrate:deploy` (or `npm run db:migrate` in development) and try again.",
      };
    }

    if (
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1001") ||
      error instanceof Prisma.PrismaClientInitializationError
    ) {
      return {
        status: "error",
        message:
          "Cannot connect to the database right now. Check that `DATABASE_URL` is correct and the database server is reachable, then try again.",
      };
    }

    console.error("quickGeneratePage failed", { projectName, pageName, error });

    return {
      status: "error",
      message: "Generation failed. Please try again.",
    };
  }
}

export async function generateNewVersion(
  projectSlug: string,
  pageId: string,
  instructionPrompt: string,
): Promise<GenerateNewVersionResult> {
  const normalizedInstruction = instructionPrompt.trim();

  if (!normalizedInstruction) {
    return {
      status: "error",
      message: "Update instructions are required.",
    };
  }

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
        },
      },
      currentVersion: {
        select: {
          id: true,
          generatedSchemaJson: true,
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

  const currentSchemaValidation = validateGeneratedPageSchema(page.currentVersion?.generatedSchemaJson);

  if (!currentSchemaValidation.success) {
    return {
      status: "error",
      message: "Current version does not contain a valid schema to update.",
    };
  }

  try {
    const prompts = buildPageGenerationPrompts({
      pagePrompt: [
        "Revise the existing landing page schema using the update instructions below.",
        "Return a complete updated schema, not a partial diff.",
        `Current schema JSON:\n${JSON.stringify(currentSchemaValidation.data, null, 2)}`,
        `Update instructions:\n${normalizedInstruction}`,
      ].join("\n\n"),
      referenceLinks: Array.isArray(page.referenceLinks)
        ? page.referenceLinks.filter((link): link is string => typeof link === "string")
        : [],
      assets: page.assets,
      allowedSections: ALLOWED_SECTION_TYPES,
      toneBrandingHints: [
        `Use ${page.project.name} brand voice where possible.`,
        "Preserve valid structure while applying requested improvements.",
      ],
    });

    const aiOutput = await callOpenAIForPageSchema(prompts);
    const parsed = validateGeneratedPageSchema(aiOutput.json);

    if (!parsed.success) {
      return {
        status: "error",
        message: "Generated revision did not pass schema validation.",
      };
    }

    const revisedSchema: GeneratedPageSchema = applyAssetFallbacks(parsed.data, page.assets);

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
          instructionPrompt: normalizedInstruction,
          generatedSchemaJson: revisedSchema as unknown as Prisma.InputJsonValue,
          notes: "Generated via iterative update.",
        },
        select: {
          id: true,
          versionNumber: true,
        },
      });

      const updatedPage = await tx.page.update({
        where: {
          id: page.id,
        },
        data: {
          currentVersionId: version.id,
          status: PageStatus.published,
          lastError: null,
          content: JSON.stringify(revisedSchema),
          publishedAt: new Date(),
        },
        select: {
          publicSlug: true,
        },
      });

      return {
        ...version,
        publicSlug: updatedPage.publicSlug,
      };
    });

    revalidateProjectAndPublicPaths({
      projectSlug,
      pageId,
      currentPublicSlug: savedVersion.publicSlug,
    });

    return {
      status: "success",
      message: `Created v${savedVersion.versionNumber} from iterative instructions.`,
      versionId: savedVersion.id,
      versionNumber: savedVersion.versionNumber,
      sectionCount: revisedSchema.sections.length,
    };
  } catch (error) {
    console.error("generateNewVersion failed", { projectSlug, pageId, error });
    return {
      status: "error",
      message: "Failed to generate a revised version. Please try again.",
    };
  }
}

export async function rollbackToVersion(
  projectSlug: string,
  pageId: string,
  versionId: string,
): Promise<RollbackVersionResult> {
  const page = await prisma.page.findFirst({
    where: {
      id: pageId,
      project: {
        slug: projectSlug,
      },
    },
    select: {
      id: true,
    },
  });

  if (!page) {
    return {
      status: "error",
      message: "Page not found.",
    };
  }

  const version = await prisma.pageVersion.findFirst({
    where: {
      id: versionId,
      pageId: page.id,
    },
    select: {
      id: true,
      versionNumber: true,
      generatedSchemaJson: true,
    },
  });

  if (!version) {
    return {
      status: "error",
      message: "Version not found for this page.",
    };
  }

  const schemaValidation = validateGeneratedPageSchema(version.generatedSchemaJson);

  if (!schemaValidation.success) {
    const details = schemaValidation.errors.slice(0, 2).join(" ");
    return {
      status: "error",
      message: details
        ? `Rollback rejected because this version has an invalid schema. ${details}`
        : "Rollback rejected because this version has an invalid schema.",
    };
  }

  const updatedPage = await prisma.$transaction(async (tx) => {
    return tx.page.update({
      where: {
        id: page.id,
      },
      data: {
        currentVersionId: version.id,
        status: PageStatus.published,
        lastError: null,
        content: JSON.stringify(schemaValidation.data),
        publishedAt: new Date(),
      },
      select: {
        publicSlug: true,
      },
    });
  });

  revalidateProjectAndPublicPaths({
    projectSlug,
    pageId,
    currentPublicSlug: updatedPage.publicSlug,
  });

  return {
    status: "success",
    message: `Rolled back to v${version.versionNumber}.`,
    versionId: version.id,
    versionNumber: version.versionNumber,
  };
}
