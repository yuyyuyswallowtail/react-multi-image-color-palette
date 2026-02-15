import chroma from "chroma-js";

export const generateRecommended = (base: string): string[] => {
  const color = chroma(base);

  // 2 analogous
  const analogous1 = color.set("hsl.h", color.get("hsl.h") + 30);
  const analogous2 = color.set("hsl.h", color.get("hsl.h") - 30);

  // 1 complementary
  const complementary = color.set("hsl.h", color.get("hsl.h") + 180);

  // 2 brightness variation
  const lighter = color.brighten(1);
  const darker = color.darken(1);

  // 1 original
  const original = color;

  // Gabungkan menjadi 6 warna
  return [
    original.hex(),
    analogous1.hex(),
    analogous2.hex(),
    complementary.hex(),
    lighter.hex(),
    darker.hex(),
  ];
};
