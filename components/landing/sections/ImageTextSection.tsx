import {
  getBody,
  getHeading,
  resolveMediaAssets,
  type SectionRenderProps,
} from "@/components/landing/types";
import { MediaFrame, SectionHeader, SectionShell } from "@/components/landing/sections/shared";

export function ImageTextSection({ section, resolveAsset }: SectionRenderProps) {
  const heading = getHeading(section);
  const body = getBody(section);
  const image = resolveMediaAssets(section, resolveAsset).find((asset) =>
    asset.mimeType.startsWith("image/"),
  );

  return (
    <SectionShell>
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <div className="space-y-4">
          <SectionHeader
            heading={heading ?? "Tell a focused story"}
            body={
              body ??
              "Pair concise copy with supporting imagery to improve readability and comprehension."
            }
            headingClassName="text-neutral-900"
            bodyClassName="text-neutral-600"
          />
        </div>
        <MediaFrame
          src={image?.storageUrl}
          alt={image?.fileName}
          fallbackLabel="Image unavailable."
          aspectClassName="aspect-[4/3]"
        />
      </div>
    </SectionShell>
  );
}
