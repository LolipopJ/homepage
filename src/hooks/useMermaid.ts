import type { MermaidConfig } from "mermaid";
import * as React from "react";

interface UseMermaidConfig extends MermaidConfig {
  /** Mermaid 库的 CDN 地址，默认使用 cdn.jsdelivr.net */
  src?: string;
}

/**
 * 初始化并运行 Mermaid
 */
const initializeMermaid = async (config?: MermaidConfig) => {
  const mermaid = window.mermaid;
  if (!mermaid) return false;

  try {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      darkMode: true,
      securityLevel: "loose",
      logLevel: "error",
      ...config,
    });
    await mermaid.run();
    return true;
  } catch (error) {
    console.error("Failed to initialize Mermaid:", error);
    return false;
  }
};

/**
 * 为 Mermaid 图表添加鼠标拖拽和滚轮缩放功能
 * @returns 清理函数
 */
const setupPanZoom = (container: HTMLElement): (() => void) => {
  const preElements = container.querySelectorAll<HTMLPreElement>(
    "pre:has(> .mermaid)",
  );
  const controller = new AbortController();
  const { signal } = controller;

  preElements.forEach((pre) => {
    const svg = pre.querySelector<SVGSVGElement>(".mermaid > svg");
    if (!svg) return;

    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    const updateTransform = () => {
      svg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    };

    // 滚轮缩放，以光标位置为中心
    pre.addEventListener(
      "wheel",
      (e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.min(Math.max(scale + delta, 0.2), 5);

        const rect = pre.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const ratio = newScale / scale;
        translateX = mouseX - ratio * (mouseX - translateX);
        translateY = mouseY - ratio * (mouseY - translateY);
        scale = newScale;

        updateTransform();
      },
      { passive: false, signal },
    );

    // 鼠标拖拽
    pre.addEventListener(
      "mousedown",
      (e: MouseEvent) => {
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
      },
      { signal },
    );

    pre.addEventListener(
      "mousemove",
      (e: MouseEvent) => {
        if (!isDragging) return;
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateTransform();
      },
      { signal },
    );

    pre.addEventListener("mouseup", () => (isDragging = false), { signal });
    pre.addEventListener("mouseleave", () => (isDragging = false), { signal });

    // 双击回归初始状态
    pre.addEventListener(
      "dblclick",
      () => {
        scale = 1;
        translateX = 0;
        translateY = 0;
        updateTransform();
      },
      { signal },
    );
  });

  return () => controller.abort();
};

/**
 * 按需加载 Mermaid 库，通过动态脚本标签注入
 * 仅当页面存在 ```mermaid 代码块时才加载库
 * @param containerRef 包含文章内容的容器引用
 * @param config Mermaid 配置选项
 */
export const useMermaid = (
  containerRef: React.RefObject<HTMLElement>,
  config: UseMermaidConfig = {},
) => {
  const {
    src = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js",
    ...mermaidConfig
  } = config;

  React.useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let cleanupPanZoom: (() => void) | undefined;

    // 检查是否存在 mermaid 代码块
    const hasMermaidBlock = container.querySelectorAll("code.language-mermaid");

    if (!hasMermaidBlock.length) return;
    hasMermaidBlock.forEach((code) => code.classList.add("mermaid"));

    const initAndSetup = async () => {
      const success = await initializeMermaid(mermaidConfig);
      if (success) {
        cleanupPanZoom = setupPanZoom(container);
      }
    };

    // 若已加载，直接初始化和渲染
    if (window.mermaid) {
      initAndSetup();
      return () => cleanupPanZoom?.();
    }

    // 未加载，创建脚本标签动态加载
    const script = document.createElement("script");
    script.src = src;
    script.type = "text/javascript";
    script.async = true;

    script.onload = () => {
      initAndSetup().catch(() => console.error("Mermaid failed to initialize"));
    };

    script.onerror = () => {
      console.error(`Failed to load Mermaid from ${src}`);
    };

    document.head.appendChild(script);

    // 清理：组件卸载时移除脚本和事件监听
    return () => {
      cleanupPanZoom?.();
      if (script.parentNode) {
        document.head.removeChild(script);
      }
    };
  }, [src, containerRef, mermaidConfig]);
};

export default useMermaid;
