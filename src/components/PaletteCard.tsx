import ImageCanvas from "./ImageCanvas";
import { ColorItem } from "./ColorItem";
import { useDispatch } from "react-redux";
import { deletePalette } from "@/features/palette/paletteSlice";
import { Button } from "@/components/ui/button";

export interface ImagePalette {
  id: string;
  image: string;
  colors: string[];
  pickers: { x: number; y: number }[];
}

interface Props {
  item: ImagePalette;
}

export default function PaletteCard({ item }: Props) {
  const dispatch = useDispatch();

  return (
    <div className="gap-6 border p-6 rounded-xl shadow-sm">
      {/* IMAGE + PICKERS */}
      <ImageCanvas
        id={item.id}
        image={item.image}
        colors={item.colors}
        pickers={item.pickers}
      />

      {/* PALETTE SIDEBAR */}
      <div className="space-y-4 pt-8">
        <div className="flex gap-3">
          <Button
            variant="destructive"
            onClick={() => dispatch(deletePalette(item.id))}
          >
            Delete
          </Button>
        </div>

        <div className="grid md:grid-cols-2 space-y-2">
          {item.colors.map((color, i) => (
            <ColorItem key={i} color={color} />
          ))}
        </div>
      </div>
    </div>
  );
}
