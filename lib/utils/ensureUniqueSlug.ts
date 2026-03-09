export async function ensureUniqueSlug(
  baseSlug: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let candidate = baseSlug;
  let suffix = 1;

  while (await exists(candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}
