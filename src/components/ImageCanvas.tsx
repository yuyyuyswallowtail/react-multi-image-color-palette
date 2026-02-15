import { useEffect, useRef, useState } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
} from "react";
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
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

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
    const hex = targetColor.replace("#", "");
    const targetR = parseInt(hex.substring(0, 2), 16);
    const targetG = parseInt(hex.substring(2, 4), 16);
    const targetB = parseInt(hex.substring(4, 6), 16);

    let bestMatch = { x: 0.5, y: 0.5 };
    let bestDistance = Infinity;
    const minPickerDistance = 40;

    const step = Math.max(2, Math.floor(Math.min(width, height) / 80));

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
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

  const scanPickerPositions = (
    ctx: CanvasRenderingContext2D,
    colorList: string[],
    width: number,
    height: number,
  ) => {
    const newPickers: Picker[] = [];
    const usedPositions: Array<{ x: number; y: number }> = [];

    for (const color of colorList) {
      const picker = findBestMatchPosition(
        ctx,
        color,
        width,
        height,
        usedPositions,
      );

      newPickers.push(picker);

      usedPositions.push({
        x: Math.round(picker.x * (width - 1)),
        y: Math.round(picker.y * (height - 1)),
      });
    }

    dispatch(
      updateColors({ id, image, colors: colorList, pickers: newPickers }),
    );
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

      // Jika colors ada tapi pickers kosong (setelah shuffle), re-scan posisi
      if (colors.length > 0 && pickers.length === 0) {
        scanPickerPositions(ctx, colors, canvas.width, canvas.height);
      }
      // Jika pertama kali upload (colors kosong), extract colors dulu
      else if (colors.length === 0) {
        const palette = await extractColors(img);
        scanPickerPositions(ctx, palette, canvas.width, canvas.height);
      }
    };

    if (img.complete) handleLoad();
    else img.addEventListener("load", handleLoad);
    return () => img.removeEventListener("load", handleLoad);
  }, [id, image, colors.length, pickers.length, dispatch]);

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

  const updatePickerPosition = (
    clientX: number,
    clientY: number,
    index: number,
  ) => {
    const img = imgRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();

    let xRatio = (clientX - rect.left) / rect.width;
    let yRatio = (clientY - rect.top) / rect.height;

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

  const startDrag = (e: ReactMouseEvent, index: number) => {
    e.preventDefault();
    setDraggingIndex(index);

    const move = (event: MouseEvent) => {
      updatePickerPosition(event.clientX, event.clientY, index);
    };

    const stop = () => {
      setDraggingIndex(null);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
  };

  const startTouchDrag = (e: ReactTouchEvent, index: number) => {
    setDraggingIndex(index);

    const move = (event: TouchEvent) => {
      event.preventDefault();
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        updatePickerPosition(touch.clientX, touch.clientY, index);
      }
    };

    const stop = () => {
      setDraggingIndex(null);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", stop);
      document.removeEventListener("touchcancel", stop);
    };

    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", stop);
    document.addEventListener("touchcancel", stop);
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
          className="absolute z-10"
          style={{
            left: `${picker.x * 100}%`,
            top: `${picker.y * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Picker circle */}
          <div
            onMouseDown={(e) => startDrag(e, index)}
            onTouchStart={(e) => startTouchDrag(e, index)}
            className="w-8 h-8 rounded-full border-2 border-white shadow-lg cursor-move"
            style={{
              backgroundColor: colors[index],
              pointerEvents: "auto",
              touchAction: "none",
            }}
          />

          {/* Hex label - tampil saat dragging */}
          {draggingIndex === index && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs font-mono rounded whitespace-nowrap shadow-lg">
              {colors[index].toUpperCase()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
