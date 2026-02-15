import { useDropzone } from "react-dropzone";
import { useDispatch } from "react-redux";
import { addPalette } from "@/features/palette/paletteSlice";
import { v4 as uuid } from "uuid";
import { toast } from "react-hot-toast";

export default function ImageUploader() {
  const dispatch = useDispatch();

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
    },
    multiple: true,
    onDrop: (files) => {
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          dispatch(
            addPalette({
              id: uuid(),
              image: reader.result as string,
              colors: [],
              pickers: [],
            }),
          );
          toast.success("Image uploaded!");
        };
        reader.readAsDataURL(file);
      });
    },
  });

  return (
    <div
      {...getRootProps()}
      className="border-dashed border-2 p-10 text-center cursor-pointer rounded-lg"
    >
      <input {...getInputProps()} />
      <p>Drag & Drop or Click to Upload</p>
    </div>
  );
}
