import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ImagePalette {
  id: string;
  image: string;
  colors: string[];
  pickers: { x: number; y: number }[];
}

interface PaletteState {
  items: ImagePalette[];
}

const initialState: PaletteState = {
  items: JSON.parse(localStorage.getItem("palettes") || "[]"),
};

const paletteSlice = createSlice({
  name: "palette",
  initialState,
  reducers: {
    addPalette(state, action: PayloadAction<ImagePalette>) {
      state.items.push(action.payload);
      localStorage.setItem("palettes", JSON.stringify(state.items));
    },
    deletePalette(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
      localStorage.setItem("palettes", JSON.stringify(state.items));
    },
    clearAll(state) {
      state.items = [];
      localStorage.removeItem("palettes");
    },
    updateColors(state, action: PayloadAction<ImagePalette>) {
      const index = state.items.findIndex((i) => i.id === action.payload.id);
      state.items[index] = action.payload;
      localStorage.setItem("palettes", JSON.stringify(state.items));
    },
  },
});

export const { addPalette, deletePalette, clearAll, updateColors } =
  paletteSlice.actions;

export default paletteSlice.reducer;
