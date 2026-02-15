import { useSelector } from "react-redux";
import { type RootState } from "@/app/store";
import PaletteCard from "./PaletteCard";

export default function PaletteList() {
  const palettes = useSelector((state: RootState) => state.palette.items);

  if (palettes.length === 0)
    return <p className="text-muted-foreground">No image uploaded yet.</p>;

  return (
    <div className="space-y-10">
      {palettes.map((item) => (
        <PaletteCard key={item.id} item={item} />
      ))}
    </div>
  );
}
