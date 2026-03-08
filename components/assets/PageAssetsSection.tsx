"use client";

import { useState } from "react";
import { AssetGrid } from "@/components/assets/AssetGrid";
import { AssetUploader } from "@/components/assets/AssetUploader";
import type { UploadedAssetDto } from "@/types/asset-upload";

type PageAssetsSectionProps = {
  projectId: string;
  pageId: string;
  initialAssets: UploadedAssetDto[];
};

export function PageAssetsSection({ projectId, pageId, initialAssets }: PageAssetsSectionProps) {
  const [assets, setAssets] = useState<UploadedAssetDto[]>(initialAssets);
  const [removingAssetId, setRemovingAssetId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function withOrder(items: UploadedAssetDto[]) {
    return items.map((asset, index) => ({ ...asset, sortOrder: index }));
  }

  async function persistOrder(nextAssets: UploadedAssetDto[]) {
    const response = await fetch("/api/assets/reorder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        pageId,
        assetIds: nextAssets.map((asset) => asset.id)
      })
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

    const nextAssets = [...assets];
    const [moved] = nextAssets.splice(index, 1);
    nextAssets.splice(targetIndex, 0, moved);

    const normalizedAssets = withOrder(nextAssets);
    setAssets(normalizedAssets);
    setErrorMessage(null);
    setStatusMessage("Saving new order...");

    try {
      await persistOrder(normalizedAssets);
      setStatusMessage("Order saved.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to reorder assets.");
      setStatusMessage(null);
      setAssets(assets);
    }
  }

  async function handleRemove(assetId: string) {
    setRemovingAssetId(assetId);
    setErrorMessage(null);
    setStatusMessage("Removing asset...");

    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: "DELETE"
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
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Assets</h2>
      <AssetUploader
        projectId={projectId}
        pageId={pageId}
        onUploaded={(asset) => {
          setAssets((current) => withOrder([...current, { ...asset, sortOrder: current.length }]));
          setErrorMessage(null);
          setStatusMessage(`Added ${asset.fileName}.`);
        }}
      />

      {errorMessage ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p> : null}
      {statusMessage ? <p className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">{statusMessage}</p> : null}

      {assets.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
          <p className="font-medium text-neutral-800">No assets uploaded yet.</p>
          <p className="mt-1">Choose a type, then drag files into the drop zone or use the picker to add your first asset.</p>
        </div>
      ) : (
        <AssetGrid
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
