import { Copy, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import { useState } from "react";
import { generateRecommended } from "@/utils/recommended";

interface Props {
  color: string;
}

export function ColorItem({ color }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${value} copied!`);
    setTimeout(() => setCopied(false), 1200);
  };

  const displayColors = generateRecommended(color).slice(-6);

  return (
    <div className="space-y-3 p-3 rounded-lg border">
      {/* Main Color */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg shadow"
            style={{ backgroundColor: color }}
          />
          <span className="font-mono text-sm">{color}</span>
        </div>

        <button onClick={() => handleCopy(color)}>
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
      </div>

      {/* Recommended Colors Grid 2x3 */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        {displayColors.map((rec, id) => (
          <div
            key={id}
            onClick={() => handleCopy(rec)}
            className="w-full h-12 rounded-md shadow cursor-pointer hover:scale-105 transition-transform flex items-center justify-center text-white font-mono text-sm select-none"
            style={{
              backgroundColor: rec,
              color:
                parseInt(rec.replace("#", ""), 16) > 0xffffff / 2
                  ? "#000"
                  : "#fff",
            }}
            title={rec}
          >
            {rec}
          </div>
        ))}
      </div>
    </div>
  );
}
