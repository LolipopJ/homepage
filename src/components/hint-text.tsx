import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useClickOutside } from "../hooks/useClickOutside";

interface HintTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** 触发文字内容 */
  text: string;
  /** 悬浮窗内显示的自定义组件 */
  children: React.ReactNode;
  /** 悬浮窗位置，默认上方 */
  placement?: "top" | "bottom" | "left" | "right";
  popoverClassName?: string;
}

// 悬浮窗与触发文字之间的间距（px）
const SPACING = 8;

const HintText: React.FC<HintTextProps> = ({
  text,
  children,
  placement = "top",
  className = "",
  popoverClassName = "",
  onMouseEnter,
  onMouseLeave,
  onClick,
  ...restProps
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  // 存储悬浮窗在 body 上的 fixed 定位坐标
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });

  const textRef = useRef<HTMLSpanElement>(null);
  // 用于在 useClickOutside 中获取悬浮窗的真实 DOM
  const popoverContentRef = useRef<HTMLDivElement>(null);

  const showPopover = children && (isMounted || isPinned);

  // 计算悬浮窗位置
  const updatePopoverPosition = useCallback(() => {
    if (!textRef.current) return;
    const rect = textRef.current.getBoundingClientRect();
    let top = 0;
    let left = 0;

    switch (placement) {
      case "top":
        top = rect.top - SPACING;
        left = rect.left + rect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + SPACING;
        left = rect.left + rect.width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2;
        left = rect.left - SPACING;
        break;
      case "right":
        top = rect.top + rect.height / 2;
        left = rect.right + SPACING;
        break;
    }
    setPopoverPosition({ top, left });
  }, [placement]);

  // 监听悬浮窗显示状态，动态更新位置并绑定滚动监听
  useEffect(() => {
    if (showPopover) {
      requestAnimationFrame(() => {
        updatePopoverPosition();
      });
      window.addEventListener("scroll", updatePopoverPosition, true);
      window.addEventListener("resize", updatePopoverPosition);
      return () => {
        window.removeEventListener("scroll", updatePopoverPosition, true);
        window.removeEventListener("resize", updatePopoverPosition);
      };
    }
  }, [showPopover, placement, updatePopoverPosition]);

  // 监听 isHovered 和 isPinned 的变化，触发动画
  useEffect(() => {
    if (isHovered || isPinned) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsMounted(false);
      }, 150); // 150ms 对应默认的动画时长
      return () => clearTimeout(timer);
    }
  }, [isHovered, isPinned]);

  // 使用 useClickOutside 监听外部点击，关闭持久化悬浮窗
  useClickOutside(() => {
    setIsPinned(false);
  }, popoverContentRef);

  // 根据 placement 映射 Tailwind 的 transform 偏移类名
  const getTransformClass = () => {
    switch (placement) {
      case "top":
        return "-translate-x-1/2 -translate-y-full";
      case "bottom":
        return "-translate-x-1/2";
      case "left":
        return "-translate-x-full -translate-y-1/2";
      case "right":
        return "-translate-y-1/2";
    }
  };

  // 映射小箭头的 Tailwind 类名
  const getArrowClasses = () => {
    const base =
      "absolute -z-10 size-2.5 border border-background-lighter bg-background-lighter";
    switch (placement) {
      case "top":
        return `${base} bottom-[-5px] left-1/2 -translate-x-1/2 rotate-45 border-t-0 border-l-0`;
      case "bottom":
        return `${base} top-[-5px] left-1/2 -translate-x-1/2 -rotate-135 border-b-0 border-r-0`;
      case "left":
        return `${base} right-[-5px] top-1/2 -translate-y-1/2 rotate-135 border-t-0 border-l-0`;
      case "right":
        return `${base} left-[-5px] top-1/2 -translate-y-1/2 -rotate-45 border-b-0 border-r-0`;
    }
  };

  // 映射填充空白间隙的 Tailwind 类名（维持 hover 连续性）
  const getGapFillerClasses = () => {
    const base = "absolute z-10";
    switch (placement) {
      case "top":
        return `${base} -bottom-2 left-0 right-0 h-2`;
      case "bottom":
        return `${base} -top-2 left-0 right-0 h-2`;
      case "left":
        return `${base} -right-2 top-0 bottom-0 w-2`;
      case "right":
        return `${base} -left-2 top-0 bottom-0 w-2`;
    }
  };

  // 悬浮窗主体内容
  const popoverContent = showPopover ? (
    <div
      ref={popoverContentRef}
      className={`fixed z-10 transition-opacity ease-out will-change-[left,top] ${
        isAnimating ? "opacity-100" : "opacity-0"
      } ${getTransformClass()}`}
      style={{ top: popoverPosition.top, left: popoverPosition.left }}
    >
      <div
        className={`relative w-max rounded-lg border border-background-lighter bg-background-lighter p-4 shadow-lg ${popoverClassName}`}
      >
        {children}
        {/* 填充空白间隙，维持 hover 连续性 */}
        <div className={getGapFillerClasses()} />
        {/* 小箭头 */}
        <div className={getArrowClasses()} />
      </div>
    </div>
  ) : null;

  return (
    <span className="relative inline-block">
      {/* 触发文字 */}
      <span
        ref={textRef}
        className={`cursor-pointer rounded bg-primary-dark px-1 transition-all ease-out ${
          isHovered || isPinned ? "brightness-75" : ""
        } ${className}`}
        onClick={(e) => {
          e.stopPropagation();
          if (children) setIsPinned(!isPinned);
          onClick?.(e);
        }}
        onMouseEnter={(e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
          onMouseLeave?.(e);
        }}
        {...restProps}
      >
        {text}
      </span>

      {/* 通过 Portal 将悬浮窗挂载到 body */}
      {typeof document !== "undefined" &&
        createPortal(popoverContent, document.body)}
    </span>
  );
};

export default HintText;
