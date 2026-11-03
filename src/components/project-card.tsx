import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";

import useHoverPreview from "../hooks/useHoverPreview";
import Grid, { GRID_UNITS, type GridProps } from "./grid";
import Icon from "./icon";

export interface ProjectCardProps {
  /** 项目名称 */
  title: string;
  /** 项目简介 */
  description: React.ReactNode;
  /** 点击卡片后跳转的地址，为卡片提供外部图标的显示依据 */
  url?: string;
  /** 项目图标，可使用 Emoji */
  icon?: React.ReactNode;
  /** 悬浮卡片时展示的预览图地址 */
  preview?: string;
  /** 卡片底部展示的徽章图片 */
  badges?: { alt: string; src: string }[];
  /** 卡片内额外的链接，例如同一项目中其它仓库的地址 */
  links?: { label: string; url: string }[];
  /**
   * 卡片占用的宽度
   * @description 按一行 `24` 份计算，支持 `1` - `24` 的整数，默认为 `12`
   */
  span?: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  description,
  url,
  icon,
  preview,
  badges,
  links,
  span = GRID_UNITS / 2,
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
      className="project-card"
      style={{ "--card-span": cardSpan } as React.CSSProperties}
    >
      <div
        ref={cardRef}
        className="theme-card group relative flex h-full cursor-pointer flex-col rounded-xl border border-border bg-background-light p-4 transition duration-300 hover:-translate-y-1 hover:border-primary-light"
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
      >
        {/* 覆盖整张卡片的跳转链接 */}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="project-card-hit absolute inset-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onFocus={showPreview}
            onBlur={hidePreview}
          >
            <span className="sr-only">{title}</span>
          </a>
        )}

        <div className="project-card-body pointer-events-none relative z-10 flex flex-1 flex-col gap-3">
          <div className="flex items-start gap-3">
            {icon && (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background-lighter text-lg leading-none">
                {icon}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2 font-bold leading-tight">
                <span className="break-words transition-colors group-hover:text-primary">
                  {title}
                </span>
                {/* 可跳转的卡片在标题右侧提示外部链接 */}
                {url && (
                  <span className="flex h-5 shrink-0 items-center">
                    <Icon
                      icon={faArrowUpRightFromSquare}
                      aria-hidden="true"
                      className="text-[0.625rem] text-foreground-tertiary transition-colors group-hover:text-primary"
                    />
                  </span>
                )}
              </div>
              <div className="mt-1 text-sm text-foreground-secondary">
                {description}
              </div>
            </div>
          </div>

          {!!badges?.length && (
            <div
              className={`mt-auto flex flex-wrap items-center gap-1 ${icon ? "ms-12" : ""}`}
            >
              {badges.map(({ alt, src }) => (
                <img
                  key={alt}
                  alt={alt}
                  src={src}
                  loading="lazy"
                  decoding="async"
                  className="h-4 w-auto"
                />
              ))}
            </div>
          )}

          {!!links?.length && (
            <div className={`flex flex-wrap gap-1.5 ${icon ? "ms-12" : ""}`}>
              {links.map(({ label, url: linkUrl }) => (
                <a
                  key={linkUrl}
                  href={linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="project-card-link rounded-full border border-primary-light px-2 py-0.5 text-xs !text-primary transition-colors hover:border-primary hover:bg-primary-light hover:!text-on-primary"
                >
                  {label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {previewNode}
    </div>
  );
};

export type ProjectGridProps = GridProps;

/**
 * 项目卡片网格
 * @description 保留此别名以兼容既有用法，新代码建议直接使用 {@link Grid}
 */
export const ProjectGrid: React.FC<ProjectGridProps> = (props) => (
  <Grid {...props} />
);

export default ProjectCard;
