"use server";

import { redirect } from "next/navigation";
import { PageStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
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

async function ensureUniquePageSlug(projectId: string, baseSlug: string) {
  let slug = baseSlug;
  let suffix = 1;

  while (
    await prisma.page.findFirst({
      where: { projectId, slug },
      select: { id: true }
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
      slug
    },
    select: {
      slug: true
    }
  });

  redirect(`/projects/${project.slug}`);
}

export async function createPage(projectSlug: string, formData: FormData) {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true, slug: true }
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

  const page = await prisma.page.create({
    data: {
      projectId: project.id,
      title,
      slug,
      prompt: prompt || null,
      referenceLinks,
      status: PageStatus.draft
    },
    select: {
      id: true
    }
  });

  redirect(`/projects/${project.slug}/pages/${page.id}`);
}
