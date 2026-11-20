import * as React from "react";

import HoverPreview from "../components/hover-preview";

/** 悬浮预览图与卡片之间的间距（px） */
const PREVIEW_SPACING = 12;
/** 悬浮预览图的最大宽度（px） */
const PREVIEW_MAX_WIDTH = 576;
/** 悬浮预览图的最大高度（px） */
const PREVIEW_MAX_HEIGHT = 320;
/** 计算预览图可用空间时预留的视口边距（px） */
const VIEWPORT_GAP = 8;

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
 * @description 预览图与卡片的一侧对齐，并向垂直空间更充裕的一侧展开
 */
const useHoverPreview = <T extends HTMLElement = HTMLDivElement>({
  src,
  alt,
}: HoverPreviewOptions): HoverPreviewResult<T> => {
  const targetRef = React.useRef<T>(null);
  const [position, setPosition] = React.useState<React.CSSProperties | null>(
    null,
  );
  const isOpen = position !== null;

  const showPreview = React.useCallback(() => {
    const rect = targetRef.current?.getBoundingClientRect();
    if (!src || !rect) return;

    const { clientWidth: width, clientHeight: height } =
      document.documentElement;
    if (
      rect.bottom <= 0 ||
      rect.top >= height ||
      rect.right <= 0 ||
      rect.left >= width
    ) {
      setPosition(null);
      return;
    }

    const left = Math.max(0, rect.left);
    const right = Math.max(0, width - rect.right);
    const widthFromLeft = width - left - VIEWPORT_GAP;
    const widthFromRight = width - right - VIEWPORT_GAP;
    const alignRight =
      widthFromLeft < PREVIEW_MAX_WIDTH && widthFromRight > widthFromLeft;

    const spaceAbove = rect.top - PREVIEW_SPACING - VIEWPORT_GAP;
    const spaceBelow = height - rect.bottom - PREVIEW_SPACING - VIEWPORT_GAP;
    const expandUpwards = spaceAbove >= spaceBelow;

    setPosition({
      ...(alignRight ? { right } : { left }),
      maxWidth: Math.min(
        alignRight ? widthFromRight : widthFromLeft,
        PREVIEW_MAX_WIDTH,
      ),
      maxHeight: Math.min(
        Math.max(spaceAbove, spaceBelow, 96),
        PREVIEW_MAX_HEIGHT,
      ),
      ...(expandUpwards
        ? { bottom: height - rect.top + PREVIEW_SPACING }
        : { top: rect.bottom + PREVIEW_SPACING }),
    });
  }, [src]);

  const hidePreview = React.useCallback(() => {
    setPosition(null);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;

    const updatePreview = () => {
      if (targetRef.current?.matches(":hover, :focus-within")) {
        showPreview();
      } else {
        hidePreview();
      }
    };

    window.addEventListener("scroll", updatePreview, true);
    window.addEventListener("resize", updatePreview);
    return () => {
      window.removeEventListener("scroll", updatePreview, true);
      window.removeEventListener("resize", updatePreview);
    };
  }, [isOpen, showPreview, hidePreview]);

  const previewNode =
    src && position ? (
      <HoverPreview key={src} src={src} alt={alt} position={position} />
    ) : null;

  return { targetRef, previewNode, showPreview, hidePreview };
};

export default useHoverPreview;
