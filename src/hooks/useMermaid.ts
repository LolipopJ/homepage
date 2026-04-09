import type { MermaidConfig } from "mermaid";
import * as React from "react";

interface UseMermaidConfig extends MermaidConfig {
  /** Mermaid 库的 CDN 地址，默认使用 cdn.jsdelivr.net */
  src?: string;
}

/**
 * 初始化并运行 Mermaid
 */
const initializeMermaid = (config?: MermaidConfig) => {
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
    mermaid.run();
    return true;
  } catch (error) {
    console.error("Failed to initialize Mermaid:", error);
    return false;
  }
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

    // 检查是否存在 mermaid 代码块
    const hasMermaidBlock = containerRef.current.querySelectorAll(
      "code.language-mermaid",
    );

    if (!hasMermaidBlock.length) return;
    hasMermaidBlock.forEach((code) => code.classList.add("mermaid"));

    // 若已加载，直接初始化和渲染
    if (window.mermaid) {
      initializeMermaid(mermaidConfig);
      return;
    }

    // 未加载，创建脚本标签动态加载
    const script = document.createElement("script");
    script.src = src;
    script.type = "text/javascript";
    script.async = true;

    script.onload = () => {
      if (!initializeMermaid(mermaidConfig)) {
        console.error("Mermaid failed to initialize");
      }
    };

    script.onerror = () => {
      console.error(`Failed to load Mermaid from ${src}`);
    };

    document.head.appendChild(script);

    // 清理：组件卸载时移除脚本
    return () => {
      if (script.parentNode) {
        document.head.removeChild(script);
      }
    };
  }, [src, containerRef, mermaidConfig]);
};

export default useMermaid;
