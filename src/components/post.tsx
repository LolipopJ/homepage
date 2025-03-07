import dayjs from "dayjs";
import { Link } from "gatsby";
import * as React from "react";

import { type Post as PostType } from "../hooks/useAllMdx";

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
    className = "",
    categoryClassName = "",
    titleClassName = "",
    excerptClassName = "",
    footerClassName = "",
  } = props;
  const { slug, frontmatter, excerpt } = post;
  const {
    categories = [],
    date: dateString,
    updated: updatedDateString,
    tags = [],
    title,
  } = frontmatter;

  const date = dayjs(dateString);
  const updatedDate = updatedDateString ? dayjs(updatedDateString) : date;

  return (
    <Link
      to={`/posts/${slug}`}
      onClick={onClick}
      className={`item-selectable flex flex-col gap-1.5 rounded-lg px-4 py-3 ${className}`}
    >
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
