import {
  getBody,
  getHeading,
  getLayoutVariant,
  resolveMediaAssets,
  type SectionRenderProps,
} from "@/components/landing/types";
import { MediaFrame, SectionHeader, SectionShell } from "@/components/landing/sections/shared";

export function ImageTextSection({ section, resolveAsset }: SectionRenderProps) {
  const heading = getHeading(section);
  const body = getBody(section);
  const layoutVariant = getLayoutVariant(section);
  const image = resolveMediaAssets(section, resolveAsset).find((asset) =>
    asset.mimeType.startsWith("image/"),
  );
  const isCentered = layoutVariant === "centered";
  const isStacked = layoutVariant === "stacked";
  const shouldSwapColumns = layoutVariant === "media-left";

  return (
    <SectionShell>
      <div
        className={[
          "grid gap-8",
          isCentered || isStacked ? "max-w-4xl mx-auto" : "md:grid-cols-2 md:items-center",
        ].join(" ")}
      >
        <div
          className={[
            "space-y-4",
            isCentered ? "text-center" : "",
            shouldSwapColumns && !isCentered && !isStacked ? "md:order-2" : "",
          ].join(" ")}
        >
          <SectionHeader
            heading={heading ?? "Tell a focused story"}
            body={
              body ??
              "Pair concise copy with supporting imagery to improve readability and comprehension."
            }
            align={isCentered ? "center" : "left"}
          />
        </div>
        <MediaFrame
          src={image?.storageUrl}
          alt={image?.fileName}
          fallbackLabel="Image unavailable."
          aspectClassName="aspect-[4/3]"
          fit={isCentered ? "contain" : "cover"}
        />
      </div>
    </SectionShell>
  );
}
