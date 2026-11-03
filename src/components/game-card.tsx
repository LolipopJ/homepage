import * as React from "react";

import useHoverPreview from "../hooks/useHoverPreview";
import { GRID_UNITS } from "./grid";

export interface GameCardProps {
  /** 游戏名称 */
  title?: string;
  /** 游戏 Logo 图片地址 */
  logo?: string;
  /** 我在游戏中的 ID */
  id?: string;
  /** 补充描述信息 */
  description?: React.ReactNode;
  /** 卡片右侧默认展示的图片 */
  image?: string;
  /** 悬浮卡片时切换到的图片 */
  hoverImage?: string;
  /** 点击卡片后跳转的地址，为卡片提供外部图标的显示依据 */
  url?: string;
  /** 悬浮卡片时展示的预览图地址 */
  preview?: string;
  /**
   * 深色主题下反色 Logo
   * @description 仅适用于纯黑色的单色 Logo，彩色 Logo 反色后会失真
   */
  logoInvert?: boolean;
  /**
   * 卡片占用的宽度
   * @description 按一行 `24` 份计算，支持 `1` - `24` 的整数，默认为 `24`
   */
  span?: number;
}

const GameCard: React.FC<GameCardProps> = ({
  title,
  logo,
  id,
  description,
  image,
  hoverImage,
  url,
  preview,
  logoInvert,
  span = GRID_UNITS,
}) => {
  const {
    targetRef: cardRef,
    previewNode,
    showPreview,
    hidePreview,
  } = useHoverPreview({ src: preview, alt: `${title} 预览` });

  const cardSpan = Math.min(Math.max(Math.round(span) || 1, 1), GRID_UNITS);

  return (
    <div
      className="game-card"
      style={{ "--card-span": cardSpan } as React.CSSProperties}
    >
      <div
        ref={cardRef}
        className="game-card-frame group"
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
      >
        <div className="game-card-surface theme-card relative rounded-xl border border-border bg-background-light py-4 transition duration-300 hover:border-primary-light">
          <div className="game-card-body pointer-events-none relative z-10 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <img
                alt={`${title} Logo`}
                src={logo}
                loading="lazy"
                decoding="async"
                className={`game-card-logo h-8 w-auto max-w-40 shrink-0 !rounded-none object-contain object-left ${logoInvert ? "game-card-logo-invert" : ""}`}
              />
              {title && (
                <span className="min-w-0 break-words font-bold leading-tight transition-colors group-hover:text-primary">
                  {title}
                </span>
              )}
            </div>

            {id && (
              <div className="game-card-id">
                <span className="game-card-id-label">ID</span>
                <span className="game-card-id-value">{id}</span>
              </div>
            )}

            {description && (
              <div className="text-xs text-foreground-secondary">
                {description}
              </div>
            )}
          </div>
        </div>

        {/* 右侧装饰图，通过越出卡片边界营造层次感 */}
        {image && (
          <div className="game-card-art">
            <img
              alt={`${title} 图片`}
              src={image}
              loading="lazy"
              decoding="async"
              className="game-card-art-img game-card-art-img-idle"
              referrerPolicy="no-referrer"
            />
            {hoverImage && (
              <img
                alt={`${title} 悬浮图片`}
                src={hoverImage}
                loading="lazy"
                decoding="async"
                className="game-card-art-img game-card-art-img-hover"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        )}

        {/* 覆盖整张卡片的跳转链接 */}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="game-card-hit rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="sr-only">{title}</span>
          </a>
        )}
      </div>

      {previewNode}
    </div>
  );
};

export default GameCard;
