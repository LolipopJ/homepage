import type { Mermaid, MermaidConfig } from "mermaid";
import * as React from "react";

import useTheme from "./useTheme";

interface UseMermaidConfig extends MermaidConfig {
  /** Mermaid 库的 CDN 地址，默认使用 cdn.jsdelivr.net */
  src?: string;
}

const DEFAULT_CONFIG: UseMermaidConfig = {};
const sources = new WeakMap<HTMLElement, string>();
const viewports = new WeakMap<
  HTMLElement,
  {
    scale: number;
    translateX: number;
    translateY: number;
  }
>();
const loads = new Map<string, Promise<Mermaid>>();
// Mermaid's initialize() changes global configuration: serialize all renders.
let renderQueue = Promise.resolve();

const loadMermaid = (src: string): Promise<Mermaid> => {
  if (window.mermaid) return Promise.resolve(window.mermaid);
  const existing = loads.get(src);
  if (existing) return existing;
  const promise = new Promise<Mermaid>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      if (window.mermaid) resolve(window.mermaid);
      else {
        script.remove();
        reject(new Error("Mermaid script did not expose its API"));
      }
    };
    script.onerror = () => {
      script.remove();
      reject(new Error(`Failed to load Mermaid from ${src}`));
    };
    document.head.appendChild(script);
  });
  loads.set(src, promise);
  void promise.catch(() => loads.delete(src));
  return promise;
};

const setupPanZoom = (container: HTMLElement): (() => void) => {
  const preElements = container.querySelectorAll<HTMLPreElement>(
    "pre:has(> .mermaid)",
  );
  const controller = new AbortController();
  const { signal } = controller;

  preElements.forEach((pre) => {
    const svg = pre.querySelector<SVGSVGElement>(".mermaid > svg");
    if (!svg) return;

    const view = viewports.get(pre) ?? {
      scale: 1,
      translateX: 0,
      translateY: 0,
    };
    viewports.set(pre, view);
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    const updateTransform = () => {
      svg.style.transform = `translate(${view.translateX}px, ${view.translateY}px) scale(${view.scale})`;
    };

    updateTransform();

    // 滚轮缩放，以光标位置为中心
    pre.addEventListener(
      "wheel",
      (e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.min(Math.max(view.scale + delta, 0.2), 5);

        const rect = pre.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const ratio = newScale / view.scale;
        view.translateX = mouseX - ratio * (mouseX - view.translateX);
        view.translateY = mouseY - ratio * (mouseY - view.translateY);
        view.scale = newScale;

        updateTransform();
      },
      { passive: false, signal },
    );

    // 鼠标拖拽
    pre.addEventListener(
      "mousedown",
      (e: MouseEvent) => {
        isDragging = true;
        startX = e.clientX - view.translateX;
        startY = e.clientY - view.translateY;
      },
      { signal },
    );

    pre.addEventListener(
      "mousemove",
      (e: MouseEvent) => {
        if (!isDragging) return;
        view.translateX = e.clientX - startX;
        view.translateY = e.clientY - startY;
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
        view.scale = 1;
        view.translateX = 0;
        view.translateY = 0;
        updateTransform();
      },
      { signal },
    );
  });

  return () => controller.abort();
};

/** Load Mermaid only for diagrams, and redraw their original source on theme changes. */
export const useMermaid = (
  containerRef: React.RefObject<HTMLElement>,
  config: UseMermaidConfig = DEFAULT_CONFIG,
) => {
  const { resolvedTheme } = useTheme();

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || !resolvedTheme) return;
    const blocks = Array.from(
      container.querySelectorAll<HTMLElement>("code.language-mermaid"),
    );
    if (!blocks.length) return;
    blocks.forEach((block) => {
      if (!sources.has(block)) sources.set(block, block.textContent ?? "");
    });

    const {
      src = "https://cdn.jsdelivr.net/npm/mermaid@12/dist/mermaid.min.js",
      ...mermaidConfig
    } = config;
    let cancelled = false;
    let cleanupPanZoom: (() => void) | undefined;

    renderQueue = renderQueue
      .then(async () => {
        if (cancelled) return;
        const mermaid = await loadMermaid(src);
        if (cancelled || !container.isConnected) return;
        blocks.forEach((block) => {
          block.classList.add("mermaid");
          block.removeAttribute("data-processed");
          block.textContent = sources.get(block) ?? "";
        });
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          logLevel: "error",
          ...mermaidConfig,
          theme: resolvedTheme === "dark" ? "dark" : "default",
          darkMode: resolvedTheme === "dark",
        });
        await mermaid.run({ nodes: blocks });
        if (!cancelled && container.isConnected)
          cleanupPanZoom = setupPanZoom(container);
      })
      .catch((error: unknown) => {
        if (!cancelled) console.error("Failed to render Mermaid:", error);
      });

    return () => {
      cancelled = true;
      cleanupPanZoom?.();
    };
  }, [containerRef, config, resolvedTheme]);
};

export default useMermaid;
