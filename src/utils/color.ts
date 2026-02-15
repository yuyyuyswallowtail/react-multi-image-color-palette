import ColorThief from "colorthief";

export const extractColors = async (image: HTMLImageElement) => {
  const colorThief = new ColorThief();
  const palette = colorThief.getPalette(image, 6);
  return palette.map(
    (rgb: number[]) =>
      "#" + rgb.map((x) => x.toString(16).padStart(2, "0")).join(""),
  );
};
