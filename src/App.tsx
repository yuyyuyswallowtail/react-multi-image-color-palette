import ImageUploader from "@/components/ImageUploader";
import PaletteList from "@/components/PaletteList";
import { ClearAllButton } from "@/components/ClearAllButton";

export default function App() {
  return (
    <div className="min-h-screen p-8 space-y-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-center">
        🎨 Modern Color Palette Extractor
        <br /> {"(You can upload multiple image!!!)"}
      </h1>

      <ImageUploader />

      <ClearAllButton />

      <PaletteList />
    </div>
  );
}
