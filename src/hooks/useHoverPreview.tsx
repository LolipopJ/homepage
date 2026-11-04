import * as React from "react";
import { createPortal } from "react-dom";

/** 悬浮预览图与卡片之间的间距（px） */
const PREVIEW_SPACING = 12;
/** 悬浮预览图的最大宽度（px） */
const PREVIEW_MAX_WIDTH = 576;
/** 悬浮预览图的最大高度（px） */
const PREVIEW_MAX_HEIGHT = 320;
/** 悬浮预览图与视口边缘的最小间距（px） */
const VIEWPORT_GAP = 8;

interface PreviewPosition {
  left: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
}

export interface HoverPreviewOptions {
  /** 预览图地址，未提供时不会展示预览图 */
  src?: string;
  /** 预览图的替代文本 */
  alt: string;
}

export interface HoverPreviewResult<T extends HTMLElement> {
  /** 绑定到卡片上的 ref，用于计算预览图的位置 */
  targetRef: React.RefObject<T>;
  /** 悬浮时展示的预览图，需要渲染在卡片内 */
  previewNode: React.ReactNode;
  /** 展示预览图 */
  showPreview: () => void;
  /** 收起预览图 */
  hidePreview: () => void;
}

/**
 * 卡片悬浮预览图
 * @description 将预览图水平居中于卡片，并选择空间更充裕的一侧展开
 */
const useHoverPreview = <T extends HTMLElement = HTMLDivElement>({
  src,
  alt,
}: HoverPreviewOptions): HoverPreviewResult<T> => {
  const targetRef = React.useRef<T>(null);
  const [position, setPosition] = React.useState<PreviewPosition | null>(null);

  const showPreview = React.useCallback(() => {
    const rect = targetRef.current?.getBoundingClientRect();
    if (!src || !rect) return;

    const halfWidth =
      Math.min(window.innerWidth - VIEWPORT_GAP * 2, PREVIEW_MAX_WIDTH) / 2;
    const left = Math.min(
      Math.max(rect.left + rect.width / 2, halfWidth + VIEWPORT_GAP),
      window.innerWidth - halfWidth - VIEWPORT_GAP,
    );

    const spaceAbove = rect.top - PREVIEW_SPACING - VIEWPORT_GAP;
    const spaceBelow =
      window.innerHeight - rect.bottom - PREVIEW_SPACING - VIEWPORT_GAP;
    const expandUpwards = spaceAbove >= spaceBelow;

    setPosition({
      left,
      maxHeight: Math.min(
        Math.max(expandUpwards ? spaceAbove : spaceBelow, 96),
        PREVIEW_MAX_HEIGHT,
      ),
      ...(expandUpwards
        ? { bottom: window.innerHeight - rect.top + PREVIEW_SPACING }
        : { top: rect.bottom + PREVIEW_SPACING }),
    });
  }, [src]);

  const hidePreview = React.useCallback(() => {
    setPosition(null);
  }, []);

  // 滚动时收起预览图，窗口缩放时重新计算位置
  React.useEffect(() => {
    if (!position) return;
    window.addEventListener("scroll", hidePreview, true);
    window.addEventListener("resize", showPreview);
    return () => {
      window.removeEventListener("scroll", hidePreview, true);
      window.removeEventListener("resize", showPreview);
    };
  }, [position, hidePreview, showPreview]);

  const previewNode =
    src && position && typeof document !== "undefined"
      ? createPortal(
          <div
            className="pointer-events-none fixed z-50 -translate-x-1/2 animate-[project-card-preview-in_150ms_ease-out] motion-reduce:animate-none"
            style={{
              left: position.left,
              top: position.top,
              bottom: position.bottom,
            }}
          >
            <img
              alt={alt}
              src={src}
              loading="lazy"
              decoding="async"
              style={{ maxHeight: position.maxHeight }}
              className="w-auto max-w-[min(36rem,calc(100vw-1rem))] rounded-lg border border-border bg-background-light object-contain shadow-lg shadow-[color:var(--shadow-hover)]"
            />
          </div>,
          document.body,
        )
      : null;

  return { targetRef, previewNode, showPreview, hidePreview };
};

export default useHoverPreview;
