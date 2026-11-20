import * as React from "react";
import { createPortal } from "react-dom";

interface HoverPreviewProps {
  src: string;
  alt: string;
  position: React.CSSProperties;
}

const HoverPreview = ({ src, alt, position }: HoverPreviewProps) => {
  const [status, setStatus] = React.useState<"loading" | "loaded" | "error">(
    "loading",
  );
  const { maxWidth, maxHeight, ...anchor } = position;

  return createPortal(
    <div
      className="
        pointer-events-none fixed z-50 overflow-hidden rounded-lg
        bg-background-light shadow-lg ring-1 shadow-(color:--shadow-hover)
        ring-border
        motion-safe:animate-[project-card-preview-in_150ms_ease-out]
      "
      style={anchor}
    >
      <img
        alt={alt}
        src={src}
        hidden={status !== "loaded"}
        decoding="async"
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        style={{ maxWidth, maxHeight }}
        className="block size-auto"
      />
      {status !== "loaded" && (
        <div
          role="status"
          className="
            grid min-h-16 w-48 place-items-center px-3 py-2 text-center text-sm
            text-foreground-secondary
          "
          style={{ maxWidth }}
        >
          {status === "error" ? "预览图加载失败" : "预览图加载中…"}
        </div>
      )}
    </div>,
    document.body,
  );
};

export default HoverPreview;
