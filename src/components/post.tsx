import dayjs from "dayjs";
import { Link } from "gatsby";
import * as React from "react";

export type PostType = Pick<MdxNode, "excerpt" | "fields" | "frontmatter">;

export interface PostProps {
  post: PostType;
  onClick?: () => void;
  titleRenderer?: (
    title: PostType["frontmatter"]["title"],
    post: PostType,
  ) => React.ReactElement;
  excerptRenderer?: (
    excerpt: PostType["excerpt"],
    post: PostType,
  ) => React.ReactElement;
  size?: "normal" | "large";
  showBanner?: boolean;
  className?: string;
  categoryClassName?: string;
  titleClassName?: string;
  excerptClassName?: string;
  footerClassName?: string;
}

/** 博客列表栏的博客简介 */
const Post: React.FC<PostProps> = (props) => {
  const {
    post,
    onClick,
    titleRenderer,
    excerptRenderer,
    size = "normal",
    showBanner: propsShowBanner = false,
    className = "",
    categoryClassName = "",
    titleClassName = "",
    excerptClassName = "",
    footerClassName = "",
  } = props;
  const {
    fields: { slug },
    frontmatter,
    excerpt,
  } = post;
  const {
    banner,
    categories = [],
    date: dateString,
    updated: updatedDateString,
    tags = [],
    title,
  } = frontmatter;

  const showBanner = propsShowBanner && banner;
  const date = dayjs(dateString);
  const updatedDate = updatedDateString ? dayjs(updatedDateString) : date;

  const titleDom = (
    <>
      {categories?.length && (
        <div
          className={`line-clamp-1 font-medium text-foreground opacity-80 ${size === "large" ? "text-base" : "text-sm"} ${categoryClassName}`}
        >
          {categories[0]}
        </div>
      )}
      <h1
        title={title}
        className={`line-clamp-3 font-bold ${size === "large" ? "text-lg" : "text-base"} ${titleClassName}`}
      >
        {titleRenderer?.(title, post) || title}
      </h1>
    </>
  );

  return (
    <Link
      to={`/posts/${slug}`}
      onClick={onClick}
      className={`item-selectable flex flex-col gap-1.5 rounded-lg px-4 py-3 ${className}`}
    >
      {showBanner ? (
        <div className="relative -mx-4">
          <img
            src={banner.publicURL}
            alt="Banner"
            className="h-auto max-h-56 min-h-52 w-full rounded-md object-cover object-center md:max-h-60 xl:max-h-64"
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-neutral-900/60 px-4 py-2.5 backdrop-blur-sm">
            {titleDom}
          </div>
        </div>
      ) : (
        titleDom
      )}
      {excerpt && (
        <p title={excerpt} className={`${excerptClassName}`}>
          {excerptRenderer?.(excerpt, post) || excerpt}
        </p>
      )}
      <div
        className={`flex text-foreground-secondary ${size === "large" ? "text-base" : "text-sm"} ${footerClassName}`}
      >
        <div
          title={`首次发布于：${date.toString()}\n最后更新于：${updatedDate.toString()}`}
          className="line-clamp-1"
        >
          {date.format(
            size === "large" ? "MM 月 DD 日 YYYY 年" : "MM月DD日YYYY年",
          )}
        </div>
        {tags?.length && (
          <div
            title={tags.join(" ")}
            className={`line-clamp-1 flex-1 before:content-['•'] ${size === "large" ? "before:mx-1.5" : "before:mx-1"}`}
          >
            {tags.join(" ")}
          </div>
        )}
      </div>
    </Link>
  );
};

export default Post;
