import type { StylePresetKey } from "@/lib/ai/stylePresets";

export type PageEditorFormModel = {
  details: {
    title: string;
    slug: string;
  };
  prompt: string;
  stylePreset: StylePresetKey;
  widgetEmbedHtml: string;
  referenceLinks: string[];
};
