import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { type RootState } from "@/app/store";
import { clearAll } from "@/features/palette/paletteSlice";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

export function ClearAllButton() {
  const dispatch = useDispatch();
  const palettes = useSelector((state: RootState) => state.palette.items);

  const [loading, setLoading] = useState(false);

  const handleClearAll = async () => {
    if (palettes.length === 0) {
      toast("No palettes to clear.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete all palettes?",
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      dispatch(clearAll());

      toast.success("All palettes cleared successfully.");
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={handleClearAll}
      disabled={loading}
      className="w-fit"
    >
      {loading ? "Clearing..." : "Clear All"}
    </Button>
  );
}
