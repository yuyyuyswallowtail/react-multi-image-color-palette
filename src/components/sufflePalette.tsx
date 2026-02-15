import { useDispatch } from "react-redux";
import { updateColors } from "@/features/palette/paletteSlice";
import { Button } from "@/components/ui/button";

export interface Picker {
  x: number;
  y: number;
}

export interface ImagePalette {
  id: string;
  image: string;
  colors: string[];
  pickers: Picker[];
}

interface Props {
  item: ImagePalette;
}

const shuffleArray = <T,>(arr: T[]): T[] =>
  [...arr].sort(() => Math.random() - 0.5);

export function ShuffleButton({ item }: Props) {
  const dispatch = useDispatch();

  const handleShuffle = () => {
    const shuffledColors = shuffleArray(item.colors);

    // Set pickers ke empty array untuk trigger re-scan di ImageCanvas
    dispatch(
      updateColors({
        ...item,
        colors: shuffledColors,
        pickers: [], // Kosongkan pickers agar ImageCanvas re-scan posisi baru
      }),
    );
  };

  return <Button onClick={handleShuffle}>Shuffle Palette</Button>;
}
