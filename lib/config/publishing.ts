const ENABLED_FLAG = "true";

export const ENABLE_PROJECT_PUBLIC_PATHS =
  process.env.NEXT_PUBLIC_ENABLE_PROJECT_PUBLIC_PATHS === ENABLED_FLAG;

export const PUBLIC_SLUG_CONSTRAINTS = {
  minLength: 2,
  maxLength: 48,
  pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;

export const RESERVED_PUBLIC_SLUGS = new Set([
  "admin",
  "api",
  "assets",
  "dashboard",
  "demo",
  "insights",
  "new",
  "p",
  "projects",
  "settings",
  "upload",
]);

export function buildCanonicalPublicPath(publicSlug: string) {
  return `/demo/${publicSlug}`;
}

export function buildProjectPublicPath(projectSlug: string, publicSlug: string) {
  return `/p/${projectSlug}/${publicSlug}`;
}

export function getPublicPathsToRevalidate(input: {
  projectSlug?: string;
  currentPublicSlug: string;
  previousPublicSlug?: string | null;
}) {
  const paths = new Set<string>();
  const addSlugPaths = (publicSlug: string) => {
    paths.add(buildCanonicalPublicPath(publicSlug));
    if (ENABLE_PROJECT_PUBLIC_PATHS && input.projectSlug) {
      paths.add(buildProjectPublicPath(input.projectSlug, publicSlug));
    }
  };

  addSlugPaths(input.currentPublicSlug);

  if (input.previousPublicSlug && input.previousPublicSlug !== input.currentPublicSlug) {
    addSlugPaths(input.previousPublicSlug);
  }

  return Array.from(paths);
}
