export const STYLE_PRESETS = [
  {
    key: "clean-corporate",
    label: "Clean Corporate",
    description: "Structured enterprise layout with calm neutrals and clear hierarchy.",
    generationInstruction:
      "Use a clean corporate template with balanced whitespace, neutral base colors, strong readability, and a professional visual tone.",
  },
  {
    key: "bold-contrast",
    label: "Bold Contrast",
    description: "High-contrast sections, strong calls-to-action, and energetic flow.",
    generationInstruction:
      "Use a bold, high-contrast template with vivid accent colors, assertive headings, and strong conversion-focused CTA blocks.",
  },
  {
    key: "minimal-editorial",
    label: "Minimal Editorial",
    description: "Typography-first structure with elegant spacing and subtle accents.",
    generationInstruction:
      "Use a minimal editorial template with typography-led sections, restrained color usage, and generous spacing.",
  },
  {
    key: "dark-premium",
    label: "Dark Premium",
    description: "Dark-mode inspired premium styling with luxe accent palette.",
    generationInstruction:
      "Use a premium dark template with deep backgrounds, luminous accents, and polished section transitions.",
  },
  {
    key: "playful-gradient",
    label: "Playful Gradient",
    description: "Colorful modern sections with gradients and expressive cards.",
    generationInstruction:
      "Use a playful modern template with vibrant gradients, friendly copy rhythm, and dynamic section variety.",
  },
  {
    key: "nature-organic",
    label: "Nature Organic",
    description: "Warm earthy palette, rounded components, and approachable style.",
    generationInstruction:
      "Use an organic template with earthy colors, soft corners, and approachable storytelling sections.",
  },
] as const;

export type StylePresetKey = (typeof STYLE_PRESETS)[number]["key"];

const STYLE_PRESET_KEY_SET = new Set<string>(STYLE_PRESETS.map((preset) => preset.key));

export function isStylePresetKey(value: string): value is StylePresetKey {
  return STYLE_PRESET_KEY_SET.has(value);
}

export function getStylePresetInstruction(stylePreset: StylePresetKey): string {
  return STYLE_PRESETS.find((preset) => preset.key === stylePreset)?.generationInstruction ?? "";
}
