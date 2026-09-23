// useClickOutside.ts
import { RefObject, useEffect, useRef } from "react";

export const useClickOutside = (
  handler: (event: MouseEvent | TouchEvent) => void,
  ref?: RefObject<HTMLElement | null>, // 新增可选的 ref 参数
) => {
  // 如果没有传入 ref，则使用内部自动创建的 ref
  const internalRef = useRef<HTMLDivElement>(null);
  const targetRef = ref || internalRef;

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // 如果 ref 未关联到 DOM，或点击目标在 ref 内部，则不处理
      if (
        !targetRef.current ||
        targetRef.current.contains(event.target as Node)
      ) {
        return;
      }
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [handler, targetRef]); // 依赖项中加入 targetRef

  return internalRef; // 依然返回内部 ref，保证不传参时的兼容性
};
