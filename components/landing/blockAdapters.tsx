import type { GeneratedBlock, GeneratedSection } from "@/lib/ai/schema";
import type { ReactNode } from "react";
import type { BlockComponentProps } from "@/components/landing/blockRegistry";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickFirstString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return undefined;
}

function pickFirstArray(record: Record<string, unknown>, keys: string[]): unknown[] | undefined {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return undefined;
}

function normalizeItems(props: Record<string, unknown>, block: GeneratedBlock) {
  const candidateItems =
    pickFirstArray(props, ["items", "features", "cards", "steps", "testimonials", "faqs"]) ??
    (Array.isArray(block.items) ? block.items : undefined);

  if (!candidateItems) {
    return undefined;
  }

  return candidateItems.filter((item): item is Record<string, unknown> => isRecord(item));
}

function normalizeMediaAssetIds(props: Record<string, unknown>, block: GeneratedBlock): string[] | undefined {
  const ids = new Set<string>();
  const candidateArrays = [
    ...(
      pickFirstArray(props, ["mediaAssetIds", "assetIds", "imageAssetIds", "logoAssetIds"]) ?? []
    ),
    ...(Array.isArray(block.mediaAssetIds) ? block.mediaAssetIds : []),
  ];

  for (const candidate of candidateArrays) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      ids.add(candidate.trim());
      continue;
    }

    if (isRecord(candidate)) {
      const nestedId =
        (typeof candidate.id === "string" && candidate.id.trim().length > 0
          ? candidate.id
          : undefined) ??
        (typeof candidate.assetId === "string" && candidate.assetId.trim().length > 0
          ? candidate.assetId
          : undefined);

      if (nestedId) {
        ids.add(nestedId.trim());
      }
    }
  }

  return ids.size > 0 ? [...ids] : undefined;
}

function normalizeCta(props: Record<string, unknown>, block: GeneratedBlock) {
  const ctaCandidate = [props.cta, props.action, props.button, block.cta].find((value) =>
    isRecord(value),
  ) as Record<string, unknown> | undefined;

  if (!ctaCandidate) {
    return undefined;
  }

  return {
    label: typeof ctaCandidate.label === "string" ? ctaCandidate.label : "",
    href: typeof ctaCandidate.href === "string" ? ctaCandidate.href : "",
  };
}

export function toSection(block: GeneratedBlock): GeneratedSection {
  const props = isRecord(block.props) ? block.props : {};

  return {
    ...block,
    layoutVariant:
      typeof block.variant === "string"
        ? block.variant
        : typeof block.layoutVariant === "string"
          ? block.layoutVariant
          : undefined,
    heading:
      pickFirstString(props, ["heading", "title", "headline", "name"]) ??
      (typeof block.heading === "string"
        ? block.heading
        : undefined),
    body:
      pickFirstString(props, ["body", "description", "subheading", "copy", "content"]) ??
      (typeof block.body === "string"
        ? block.body
        : undefined),
    items: normalizeItems(props, block),
    mediaAssetIds: normalizeMediaAssetIds(props, block),
    cta: normalizeCta(props, block),
  };
}

export function validateCommonProps(props: Record<string, unknown> | undefined): boolean {
  if (props === undefined) {
    return true;
  }

  if (!isRecord(props)) {
    return false;
  }

  if (props.heading !== undefined && typeof props.heading !== "string") {
    return false;
  }

  if (props.body !== undefined && typeof props.body !== "string") {
    return false;
  }

  if (
    props.items !== undefined &&
    (!Array.isArray(props.items) ||
      props.items.some((item) => typeof item !== "object" || item === null || Array.isArray(item)))
  ) {
    return false;
  }

  if (
    props.mediaAssetIds !== undefined &&
    (!Array.isArray(props.mediaAssetIds) ||
      props.mediaAssetIds.some((assetId) => typeof assetId !== "string"))
  ) {
    return false;
  }

  if (props.cta !== undefined) {
    if (!isRecord(props.cta)) {
      return false;
    }

    if (typeof props.cta.label !== "string" || typeof props.cta.href !== "string") {
      return false;
    }
  }

  return true;
}

export function createBlockAdapter(
  SectionComponent: (props: {
    section: GeneratedSection;
    resolveAsset: BlockComponentProps["resolveAsset"];
  }) => ReactNode,
) {
  return function BlockAdapter({ block, resolveAsset }: BlockComponentProps) {
    return <SectionComponent section={toSection(block)} resolveAsset={resolveAsset} />;
  };
}
