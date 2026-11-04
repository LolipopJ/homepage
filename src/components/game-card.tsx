import * as React from "react";

import useHoverPreview from "../hooks/useHoverPreview";

const artImageClassName =
  "absolute inset-0 size-full object-cover transition-[opacity,transform] [transition-duration:320ms,420ms] [transition-timing-function:ease,cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

export interface GameCardProps extends React.HTMLAttributes<HTMLDivElement> {
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
  className = "",
  ...props
}) => {
  const {
    targetRef: cardRef,
    previewNode,
    showPreview,
    hidePreview,
  } = useHoverPreview({ src: preview, alt: `${title} preview` });

  return (
    <div
      title={title}
      className={`relative [--game-card-art-width:6rem] min-[360px]:[--game-card-art-width:clamp(11rem,46%,22rem)] [.post-grid>&]:m-0 ${className}`}
      {...props}
    >
      <div
        ref={cardRef}
        className="group relative isolate"
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
      >
        <div className="relative rounded-xl border border-border bg-background-light py-4 pe-[calc(var(--game-card-art-width)+1.25rem)] ps-5 transition duration-300 group-hover:border-primary max-[640px]:pe-[calc(var(--game-card-art-width)+0.75rem)] max-[640px]:ps-4">
          <div className="pointer-events-none relative z-10 flex flex-col gap-2 [&_a]:pointer-events-auto">
            <div className="flex items-center gap-3">
              <img
                alt={`${title} Logo`}
                src={logo}
                loading="lazy"
                decoding="async"
                className={`h-12 w-auto max-w-40 shrink-0 !rounded-none object-contain object-left transition-[filter] duration-200 ease-[ease] ${logoInvert ? "game-card-logo-invert" : ""}`}
              />
              {/* {title && (
                <span className="min-w-0 break-words font-bold leading-tight transition-colors group-hover:text-primary">
                  {title}
                </span>
              )} */}
            </div>

            {id && (
              <div className="flex flex-wrap items-baseline gap-1.5 text-[0.875rem]">
                <span className="text-[0.625rem] font-bold uppercase leading-none tracking-[0.08em] text-foreground-tertiary">
                  ID
                </span>
                <span className="font-semibold">{id}</span>
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
          <div className="pointer-events-none absolute -inset-y-3 -right-3 z-20 w-[var(--game-card-art-width)] translate-y-[0.35rem] -rotate-2 overflow-hidden rounded-xl border border-border shadow-lg shadow-[color:var(--shadow-hover)] transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-hover:rotate-0 motion-reduce:transition-none max-[640px]:right-0">
            <img
              alt={`${title} image`}
              src={image}
              loading="lazy"
              decoding="async"
              className={`${artImageClassName} group-hover:translate-x-[-8%] group-hover:scale-[0.94] group-hover:opacity-0`}
              referrerPolicy="no-referrer"
            />
            {hoverImage && (
              <img
                alt={`${title} hover image`}
                src={hoverImage}
                loading="lazy"
                decoding="async"
                className={`${artImageClassName} translate-x-[8%] scale-[1.08] opacity-0 group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100`}
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
            className="absolute inset-0 rounded-xl hover:!border-0 hover:!pb-0 hover:!no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
