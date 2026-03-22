"use client";

import { useMemo, useRef, useState } from "react";
import { AssetPreviewGallery } from "@/components/assets/AssetPreviewGallery";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { UploadedAssetDto } from "@/types/asset-upload";

type PageAssetsSectionProps = {
  projectId: string;
  pageId: string;
  initialAssets: UploadedAssetDto[];
  isGenerationReady: boolean;
  requiredImageSlots: number;
  requiresLogo: boolean;
};

type UploadSlot = {
  key: string;
  title: string;
  description: string;
  type: "logo" | "image";
};

function readSlotKey(asset: UploadedAssetDto): string | null {
  const metadata = (asset.metadata ?? {}) as Record<string, unknown>;
  return typeof metadata.slotKey === "string" ? metadata.slotKey : null;
}

export function PageAssetsSection({
  projectId,
  pageId,
  initialAssets,
  isGenerationReady,
  requiredImageSlots,
  requiresLogo,
}: PageAssetsSectionProps) {
  const [assets, setAssets] = useState<UploadedAssetDto[]>(initialAssets);
  const [removingAssetId, setRemovingAssetId] = useState<string | null>(null);
  const [uploadingSlotKey, setUploadingSlotKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const uploadSlots = useMemo<UploadSlot[]>(() => {
    const slots: UploadSlot[] = [];

    if (requiresLogo) {
      slots.push({
        key: "logo",
        title: "Logo",
        description: "Upload the primary brand logo.",
        type: "logo",
      });
    }

    for (let index = 0; index < requiredImageSlots; index += 1) {
      slots.push({
        key: `image-${index + 1}`,
        title: `Image ${index + 1}`,
        description: `Upload content image ${index + 1}.`,
        type: "image",
      });
    }

    return slots;
  }, [requiredImageSlots, requiresLogo]);

  const assetsBySlot = useMemo(() => {
    const slotMap = new Map<string, UploadedAssetDto>();

    for (const asset of assets) {
      const slotKey = readSlotKey(asset);
      if (slotKey && !slotMap.has(slotKey)) {
        slotMap.set(slotKey, asset);
      }
    }

    if (requiresLogo && !slotMap.has("logo")) {
      const fallbackLogo = assets.find((asset) => asset.type === "logo");
      if (fallbackLogo) {
        slotMap.set("logo", fallbackLogo);
      }
    }

    const fallbackImages = assets.filter((asset) => asset.type === "image");
    for (let index = 0; index < requiredImageSlots; index += 1) {
      const slotKey = `image-${index + 1}`;
      if (!slotMap.has(slotKey) && fallbackImages[index]) {
        slotMap.set(slotKey, fallbackImages[index]);
      }
    }

    return slotMap;
  }, [assets, requiredImageSlots, requiresLogo]);

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

  async function handleSlotUpload(slot: UploadSlot, file: File | null) {
    if (!file) {
      return;
    }

    if (assetsBySlot.has(slot.key)) {
      setErrorMessage(`${slot.title} already has an upload. Remove it first.`);
      return;
    }

    setUploadingSlotKey(slot.key);
    setErrorMessage(null);
    setStatusMessage(`Uploading ${file.name} to ${slot.title}...`);

    try {
      const payload = new FormData();
      payload.set("projectId", projectId);
      payload.set("pageId", pageId);
      payload.set("type", slot.type);
      payload.set("slotKey", slot.key);
      payload.set("file", file);

      const response = await fetch("/api/assets/upload", {
        method: "POST",
        body: payload,
      });

      const data = (await response.json()) as
        | { ok: true; asset: UploadedAssetDto }
        | { ok: false; error: { message: string } };

      if (!response.ok || !data.ok) {
        throw new Error(data.ok ? "Upload failed." : data.error.message);
      }

      setAssets((current) => withOrder([...current, { ...data.asset, sortOrder: current.length }]));
      setStatusMessage(`Added ${file.name} to ${slot.title}.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Upload failed. Please try again.");
      setStatusMessage(null);
    } finally {
      setUploadingSlotKey(null);
      const input = fileInputsRef.current[slot.key];
      if (input) {
        input.value = "";
      }
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface-elevated p-6">
      <h2 className="text-lg font-semibold">Assets</h2>
      <div className="space-y-2 rounded-lg border border-border bg-surface p-3">
        <h3 className="text-base font-semibold text-fg">Image upload session</h3>
        {isGenerationReady ? (
          <p className="text-sm text-muted">
            Upload per required slot. Each slot accepts only one file until deleted.
          </p>
        ) : (
          <Alert variant="info">
            This will be available after generation. Build or generate a version first, then upload files by slot.
          </Alert>
        )}

        {isGenerationReady ? (
          <div className="space-y-3">
            {uploadSlots.length === 0 ? (
              <Alert variant="info">No image slots were detected from the current generated layout yet.</Alert>
            ) : (
              uploadSlots.map((slot) => {
                const existingAsset = assetsBySlot.get(slot.key) ?? null;
                const isUploading = uploadingSlotKey === slot.key;

                return (
                  <div
                    key={slot.key}
                    className="grid gap-3 rounded-xl border border-border bg-surface-elevated p-3 md:grid-cols-[1fr_auto] md:items-center"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-fg">{slot.title}</p>
                      <p className="text-xs text-muted">{slot.description}</p>
                      {existingAsset ? (
                        <div className="space-y-1 text-xs text-muted">
                          <a href={existingAsset.storageUrl} target="_blank" rel="noreferrer" className="underline">
                            {existingAsset.fileName}
                          </a>
                        </div>
                      ) : (
                        <p className="text-xs text-muted">No file uploaded.</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <input
                        ref={(node) => {
                          fileInputsRef.current[slot.key] = node;
                        }}
                        type="file"
                        className="hidden"
                        onChange={(event) => void handleSlotUpload(slot, event.target.files?.[0] ?? null)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => fileInputsRef.current[slot.key]?.click()}
                        disabled={Boolean(existingAsset) || isUploading}
                      >
                        {isUploading ? "Uploading…" : "Upload"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!existingAsset || removingAssetId === existingAsset?.id}
                        onClick={() => {
                          if (existingAsset) {
                            void handleRemove(existingAsset.id);
                          }
                        }}
                      >
                        {removingAssetId === existingAsset?.id ? "Removing…" : "Delete"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : null}
      </div>

      {errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}
      {statusMessage ? <Alert variant="info">{statusMessage}</Alert> : null}

      {isReordering ? <Alert variant="info">Updating gallery order...</Alert> : null}

      {assets.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">
          <p className="font-medium text-fg">No assets uploaded yet.</p>
          <p className="mt-1">Generate a page first to unlock slot-based uploads.</p>
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
