import * as React from "react";

import useHoverPreview from "../hooks/useHoverPreview";

export interface ProjectCardProps extends React.HTMLAttributes<HTMLDivElement> {
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
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  description,
  url,
  icon,
  preview,
  badges,
  links,
  className = "",
  ...props
}) => {
  const {
    targetRef: cardRef,
    previewNode,
    showPreview,
    hidePreview,
  } = useHoverPreview({ src: preview, alt: `${title} 预览` });

  return (
    <div className={`max-[640px]:col-span-full ${className}`} {...props}>
      <div
        ref={cardRef}
        className="group relative flex h-full cursor-pointer flex-col rounded-xl border border-border bg-background-light p-4 transition duration-300 hover:-translate-y-1 hover:border-primary"
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
      >
        {/* 覆盖整张卡片的跳转链接 */}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="absolute inset-0 rounded-xl hover:!border-0 hover:!pb-0 hover:!no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onFocus={showPreview}
            onBlur={hidePreview}
          >
            <span className="sr-only">{title}</span>
          </a>
        )}

        <div className="pointer-events-none relative z-10 flex flex-1 flex-col gap-3 [&_a]:pointer-events-auto">
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
                  className="rounded-full border border-primary-light px-2 py-0.5 text-xs !text-primary transition-colors hover:!border-solid hover:!border-primary hover:bg-primary-light hover:!pb-0.5 hover:!text-on-primary hover:!no-underline"
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

export default ProjectCard;
