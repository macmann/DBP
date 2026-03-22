export const STYLE_PRESETS = [
  {
    key: "clean-corporate",
    label: "Clean Corporate",
    description: "Professional neutral palette with clear typography.",
    generationInstruction:
      "Apply a clean corporate visual style with neutral colors, balanced spacing, and strong readability. Keep section structure driven by the user prompt.",
  },
  {
    key: "bold-contrast",
    label: "Bold Contrast",
    description: "High-contrast palette with energetic emphasis.",
    generationInstruction:
      "Apply a bold, high-contrast visual style with vivid accents and assertive copy tone. Keep section structure driven by the user prompt.",
  },
  {
    key: "minimal-editorial",
    label: "Minimal Editorial",
    description: "Typography-first style with subtle accents.",
    generationInstruction:
      "Apply a minimal editorial visual style with restrained color and generous spacing. Keep section structure driven by the user prompt.",
  },
  {
    key: "dark-premium",
    label: "Dark Premium",
    description: "Dark premium palette with polished highlights.",
    generationInstruction:
      "Apply a premium dark visual style with deep backgrounds and luminous accents. Keep section structure driven by the user prompt.",
  },
  {
    key: "playful-gradient",
    label: "Playful Gradient",
    description: "Colorful gradient-forward style with playful energy.",
    generationInstruction:
      "Apply a playful modern visual style with vibrant gradients and friendly tone. Keep section structure driven by the user prompt.",
  },
  {
    key: "nature-organic",
    label: "Nature Organic",
    description: "Warm earthy palette with soft rounded styling.",
    generationInstruction:
      "Apply an organic visual style with earthy colors and soft corners. Keep section structure driven by the user prompt.",
  },
] as const;

export type StylePresetKey = (typeof STYLE_PRESETS)[number]["key"];

const STYLE_PRESET_KEY_SET = new Set<string>(STYLE_PRESETS.map((preset) => preset.key));
const STYLE_BLOCK_MARKER = "Design style requirement:";
export const DEFAULT_STYLE_PRESET: StylePresetKey = STYLE_PRESETS[0].key;

export function isStylePresetKey(value: string): value is StylePresetKey {
  return STYLE_PRESET_KEY_SET.has(value);
}

export function getStylePresetInstruction(stylePreset: StylePresetKey): string {
  return STYLE_PRESETS.find((preset) => preset.key === stylePreset)?.generationInstruction ?? "";
}

export function composePromptWithStyle(prompt: string, stylePreset: StylePresetKey): string {
  const basePrompt = stripStyleInstructionFromPrompt(prompt).trim();
  const styleInstruction = getStylePresetInstruction(stylePreset);
  return `${basePrompt}\n\n${STYLE_BLOCK_MARKER}\n${styleInstruction}`.trim();
}

export function detectStylePresetFromPrompt(prompt: string): StylePresetKey {
  const matched = STYLE_PRESETS.find((preset) => prompt.includes(preset.generationInstruction));
  return matched?.key ?? DEFAULT_STYLE_PRESET;
}

export function stripStyleInstructionFromPrompt(prompt: string): string {
  const markerIndex = prompt.indexOf(STYLE_BLOCK_MARKER);
  if (markerIndex === -1) {
    return prompt;
  }

  return prompt.slice(0, markerIndex).trimEnd();
}
