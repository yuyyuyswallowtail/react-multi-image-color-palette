import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useDispatch } from "react-redux";
import { updateColors } from "@/features/palette/paletteSlice";
import { extractColors } from "@/utils/color";

interface Picker {
  x: number; // 0 to 1
  y: number; // 0 to 1
}

interface Props {
  id: string;
  image: string;
  colors: string[];
  pickers: Picker[];
}

export default function ImageCanvas({ id, image, colors, pickers }: Props) {
  const dispatch = useDispatch();
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [localPickers, setLocalPickers] = useState<Picker[]>(pickers);

  useEffect(() => {
    setLocalPickers(pickers);
  }, [pickers]);

  // Helper function untuk mencari posisi pixel yang paling mirip dengan warna target
  const findBestMatchPosition = (
    ctx: CanvasRenderingContext2D,
    targetColor: string,
    width: number,
    height: number,
    usedPositions: Array<{ x: number; y: number }>,
  ): Picker => {
    // Convert hex to RGB
    const hex = targetColor.replace("#", "");
    const targetR = parseInt(hex.substring(0, 2), 16);
    const targetG = parseInt(hex.substring(2, 4), 16);
    const targetB = parseInt(hex.substring(4, 6), 16);

    let bestMatch = { x: 0.5, y: 0.5 };
    let bestDistance = Infinity;
    const minPickerDistance = 40; // Jarak minimum antar picker (dalam pixel)

    // Sample dengan grid yang lebih rapat untuk akurasi lebih baik
    const step = Math.max(2, Math.floor(Math.min(width, height) / 80));

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        // Check jarak dengan picker yang sudah ada
        let tooClose = false;
        for (const used of usedPositions) {
          const dist = Math.sqrt(
            Math.pow(x - used.x, 2) + Math.pow(y - used.y, 2),
          );
          if (dist < minPickerDistance) {
            tooClose = true;
            break;
          }
        }

        if (tooClose) continue;

        const pixel = ctx.getImageData(x, y, 1, 1).data;

        // Calculate color distance (Euclidean distance in RGB space)
        const colorDistance = Math.sqrt(
          Math.pow(pixel[0] - targetR, 2) +
            Math.pow(pixel[1] - targetG, 2) +
            Math.pow(pixel[2] - targetB, 2),
        );

        if (colorDistance < bestDistance) {
          bestDistance = colorDistance;
          bestMatch = { x, y };
        }
      }
    }

    return {
      x: bestMatch.x / (width - 1),
      y: bestMatch.y / (height - 1),
    };
  };

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const handleLoad = async () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      canvasRef.current = canvas;

      if (colors.length === 0) {
        const palette = await extractColors(img);
        const defaultPickers: Picker[] = [];
        const usedPositions: Array<{ x: number; y: number }> = [];

        // Untuk setiap warna, cari posisi terbaik
        for (const color of palette) {
          const picker = findBestMatchPosition(
            ctx,
            color,
            canvas.width,
            canvas.height,
            usedPositions,
          );

          defaultPickers.push(picker);

          // Simpan posisi dalam pixel untuk pengecekan jarak berikutnya
          usedPositions.push({
            x: Math.round(picker.x * (canvas.width - 1)),
            y: Math.round(picker.y * (canvas.height - 1)),
          });
        }

        dispatch(
          updateColors({ id, image, colors: palette, pickers: defaultPickers }),
        );
      }
    };

    if (img.complete) handleLoad();
    else img.addEventListener("load", handleLoad);
    return () => img.removeEventListener("load", handleLoad);
  }, [id, image, colors.length, dispatch]);

  const getColorFromRatio = (xRatio: number, yRatio: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return "#000000";
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return "#000000";

    const actualX = Math.round(xRatio * (canvas.width - 1));
    const actualY = Math.round(yRatio * (canvas.height - 1));

    const safeX = Math.max(0, Math.min(actualX, canvas.width - 1));
    const safeY = Math.max(0, Math.min(actualY, canvas.height - 1));

    const pixel = ctx.getImageData(safeX, safeY, 1, 1).data;
    return (
      "#" +
      [pixel[0], pixel[1], pixel[2]]
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("")
    );
  };

  const startDrag = (e: ReactMouseEvent, index: number) => {
    e.preventDefault();
    const img = imgRef.current;
    if (!img) return;

    const move = (event: MouseEvent) => {
      const rect = img.getBoundingClientRect();

      let xRatio = (event.clientX - rect.left) / rect.width;
      let yRatio = (event.clientY - rect.top) / rect.height;

      xRatio = Math.max(0, Math.min(xRatio, 1));
      yRatio = Math.max(0, Math.min(yRatio, 1));

      const updatedPickers = [...localPickers];
      updatedPickers[index] = { x: xRatio, y: yRatio };

      const newColor = getColorFromRatio(xRatio, yRatio);
      const updatedColors = [...colors];
      updatedColors[index] = newColor;

      setLocalPickers(updatedPickers);
      dispatch(
        updateColors({
          id,
          image,
          colors: updatedColors,
          pickers: updatedPickers,
        }),
      );
    };

    const stop = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
  };

  return (
    <div className="relative w-fit mx-auto lg:mx-0 overflow-hidden rounded-xl shadow-md border border-gray-200">
      <img
        ref={imgRef}
        src={image}
        alt="uploaded"
        className="block max-w-full h-auto select-none"
        draggable={false}
        crossOrigin="anonymous"
      />

      {localPickers.map((picker, index) => (
        <div
          key={index}
          onMouseDown={(e) => startDrag(e, index)}
          className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-move z-10 touch-none"
          style={{
            left: `${picker.x * 100}%`,
            top: `${picker.y * 100}%`,
            backgroundColor: colors[index],
            transform: "translate(-50%, -50%)",
            pointerEvents: "auto",
          }}
        />
      ))}
    </div>
  );
}
