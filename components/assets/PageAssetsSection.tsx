"use client";

import { useState } from "react";
import { AssetPreviewGallery } from "@/components/assets/AssetPreviewGallery";
import { AssetUploader } from "@/components/assets/AssetUploader";
import { Alert } from "@/components/ui/alert";
import type { UploadedAssetDto } from "@/types/asset-upload";

type PageAssetsSectionProps = {
  projectId: string;
  pageId: string;
  initialAssets: UploadedAssetDto[];
  isGenerationReady: boolean;
};

const IMAGE_SLOT_COUNT = 4;

export function PageAssetsSection({ projectId, pageId, initialAssets, isGenerationReady }: PageAssetsSectionProps) {
  const [assets, setAssets] = useState<UploadedAssetDto[]>(initialAssets);
  const [removingAssetId, setRemovingAssetId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  function withOrder(items: UploadedAssetDto[]) {
    return items.map((asset, index) => ({ ...asset, sortOrder: index }));
  }

  async function persistOrder(nextAssets: UploadedAssetDto[]) {
    const response = await fetch("/api/assets/reorder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pageId,
        assetIds: nextAssets.map((asset) => asset.id),
      }),
    });

    if (!response.ok) {
      throw new Error("Could not save the new order. Please try again.");
    }
  }

  async function handleMove(assetId: string, direction: "up" | "down") {
    const index = assets.findIndex((asset) => asset.id === assetId);
    if (index < 0) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= assets.length) {
      return;
    }

    const currentAssets = assets;
    const nextAssets = [...assets];
    const [moved] = nextAssets.splice(index, 1);
    nextAssets.splice(targetIndex, 0, moved);

    const normalizedAssets = withOrder(nextAssets);
    setAssets(normalizedAssets);
    setErrorMessage(null);
    setStatusMessage("Saving new order...");
    setIsReordering(true);

    try {
      await persistOrder(normalizedAssets);
      setStatusMessage("Order saved.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to reorder assets.");
      setStatusMessage(null);
      setAssets(currentAssets);
    } finally {
      setIsReordering(false);
    }
  }

  async function handleRemove(assetId: string) {
    setRemovingAssetId(assetId);
    setErrorMessage(null);
    setStatusMessage("Removing asset...");

    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Could not remove this asset right now.");
      }

      const remaining = withOrder(assets.filter((asset) => asset.id !== assetId));
      setAssets(remaining);
      await persistOrder(remaining);
      setStatusMessage("Asset removed.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to remove asset.");
      setStatusMessage(null);
    } finally {
      setRemovingAssetId(null);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface-elevated p-6">
      <h2 className="text-lg font-semibold">Assets</h2>
      <div className="space-y-2 rounded-lg border border-border bg-surface p-3">
        <h3 className="text-base font-semibold text-fg">Image upload session</h3>
        {isGenerationReady ? (
          <p className="text-sm text-muted">
            Upload files by slot (logo, image 1, image 2, etc.). Uploads appear immediately in the asset gallery and are available to future generations.
          </p>
        ) : (
          <Alert variant="info">
            This will be available after generation. Build or generate a version first, then upload files by slot.
          </Alert>
        )}

        {isGenerationReady ? (
          <div className="space-y-3">
            <AssetUploader
              projectId={projectId}
              pageId={pageId}
              title="Logo"
              description="Upload the primary brand logo."
              fixedType="logo"
              allowMultiple={false}
              onUploaded={(asset) => {
                setAssets((current) =>
                  withOrder([...current, { ...asset, sortOrder: current.length }]),
                );
                setErrorMessage(null);
                setStatusMessage(`Added ${asset.fileName} to logo slot.`);
              }}
            />
            {Array.from({ length: IMAGE_SLOT_COUNT }).map((_, index) => (
              <AssetUploader
                key={`image-slot-${index + 1}`}
                projectId={projectId}
                pageId={pageId}
                title={`Image ${index + 1}`}
                description={`Upload content image ${index + 1}.`}
                fixedType="image"
                allowMultiple={false}
                onUploaded={(asset) => {
                  setAssets((current) =>
                    withOrder([...current, { ...asset, sortOrder: current.length }]),
                  );
                  setErrorMessage(null);
                  setStatusMessage(`Added ${asset.fileName} to image ${index + 1} slot.`);
                }}
              />
            ))}
          </div>
        ) : null}
      </div>

      {errorMessage ? (
        <Alert variant="danger">{errorMessage}</Alert>
      ) : null}
      {statusMessage ? (
        <Alert variant="info">{statusMessage}</Alert>
      ) : null}

      {isReordering ? (
        <Alert variant="info">Updating gallery order...</Alert>
      ) : null}

      {assets.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">
          <p className="font-medium text-fg">No assets uploaded yet.</p>
          <p className="mt-1">
            Generate a page first to unlock slot-based uploads (logo, image 1, image 2, and more).
          </p>
        </div>
      ) : (
        <AssetPreviewGallery
          assets={assets}
          removingAssetId={removingAssetId}
          onMoveUp={(assetId) => void handleMove(assetId, "up")}
          onMoveDown={(assetId) => void handleMove(assetId, "down")}
          onRemove={(assetId) => void handleRemove(assetId)}
        />
      )}
    </section>
  );
}
