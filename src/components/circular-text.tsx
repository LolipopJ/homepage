/** https://reactbits.dev/text-animations/circular-text */
import React from "react";

interface CircularTextProps {
  text: string;
  spinDuration?: number;
  onHover?: "slowDown" | "speedUp" | "pause" | "goBonkers";
  className?: string;
}

/** 悬浮时相对 spinDuration 的时长倍数，pause 单独处理为暂停动画 */
const HOVER_DURATION_FACTOR: Record<
  NonNullable<CircularTextProps["onHover"]>,
  number
> = {
  slowDown: 2,
  speedUp: 1 / 4,
  pause: 1,
  goBonkers: 1 / 20,
};

const CircularText: React.FC<CircularTextProps> = ({
  text,
  spinDuration = 20,
  onHover = "speedUp",
  className = "",
}) => {
  const [hovering, setHovering] = React.useState(false);

  const letterTransforms = React.useMemo(() => {
    const chars = Array.from(text);
    const factor = Math.PI / chars.length;
    return chars.map((letter, i) => ({
      letter,
      transform: `rotateZ(${(360 / chars.length) * i}deg) translate3d(${factor * i}px, ${factor * i}px, 0)`,
    }));
  }, [text]);

  const isPaused = hovering && onHover === "pause";
  const duration = hovering
    ? spinDuration * HOVER_DURATION_FACTOR[onHover]
    : spinDuration;
  const scale = hovering && onHover === "goBonkers" ? 0.8 : 1;

  return (
    <div
      className={`relative m-0 mx-auto h-[200px] w-[200px] origin-center rounded-full text-center font-black text-white transition-[scale] duration-300 ${className}`}
      style={{
        animation: `circular-spin ${duration}s linear infinite`,
        animationPlayState: isPaused ? "paused" : "running",
        scale,
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {letterTransforms.map(({ letter, transform }, i) => (
        <span
          key={i}
          className="absolute inset-0 inline-block text-2xl transition-all duration-500 ease-[cubic-bezier(0,0,0,1)]"
          style={{ transform, WebkitTransform: transform }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
};

export default CircularText;
