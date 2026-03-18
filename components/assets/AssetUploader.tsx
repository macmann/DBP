"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { UploadedAssetDto } from "@/types/asset-upload";

const ASSET_TYPES = ["logo", "screenshot", "image"] as const;

type AssetType = (typeof ASSET_TYPES)[number];

type AssetUploaderProps = {
  projectId: string;
  pageId: string;
  onUploaded: (asset: UploadedAssetDto) => void;
};

export function AssetUploader({ projectId, pageId, onUploaded }: AssetUploaderProps) {
  const [selectedType, setSelectedType] = useState<AssetType>("image");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const helperMessage = useMemo(() => {
    if (errorMessage) {
      return errorMessage;
    }

    if (progressMessage) {
      return progressMessage;
    }

    return "Drop files here or choose files to upload. Accepted formats include PNG, JPG, WEBP, GIF, SVG, PDF, TXT, and ZIP.";
  }, [errorMessage, progressMessage]);

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      setErrorMessage("No files were selected. Please choose one or more files to continue.");
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);

    try {
      const files = Array.from(fileList);

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setProgressMessage(`Uploading ${index + 1} of ${files.length}: ${file.name}`);

        const payload = new FormData();
        payload.set("projectId", projectId);
        payload.set("pageId", pageId);
        payload.set("type", selectedType);
        payload.set("file", file);

        const response = await fetch("/api/assets/upload", {
          method: "POST",
          body: payload
        });

        const data = (await response.json()) as
          | { ok: true; asset: UploadedAssetDto }
          | { ok: false; error: { message: string } };

        if (!response.ok || !data.ok) {
          throw new Error(data.ok ? "Upload failed." : data.error.message);
        }

        onUploaded(data.asset);
      }

      setProgressMessage("Upload complete. Your assets are now available below.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Upload failed. Please try again.");
      setProgressMessage(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface-elevated p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-fg">Upload assets</h3>
          <p className="text-sm text-muted">Assign a type before uploading so generated pages can use each file correctly.</p>
        </div>

        <label className="text-sm text-fg">
          Type
          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value as AssetType)}
            className="ml-2 rounded-lg border border-border bg-surface px-2 py-1 text-sm"
          >
            {ASSET_TYPES.map((assetType) => (
              <option key={assetType} value={assetType}>
                {assetType}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void uploadFiles(event.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition ${
          isDragging ? "border-primary bg-secondary" : "border-border bg-surface"
        }`}
      >
        <p className="text-sm text-fg">Drag and drop files here</p>
        <p className="mt-1 text-xs text-muted">or use the file picker fallback</p>
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="mt-4"
          size="sm"
        >
          {isUploading ? "Uploading…" : "Choose files"}
        </Button>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(event) => void uploadFiles(event.target.files)} />
      </div>

      <p className={`text-sm ${errorMessage ? "text-danger" : "text-muted"}`}>{helperMessage}</p>
    </section>
  );
}
