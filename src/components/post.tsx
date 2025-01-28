import dayjs from "dayjs";
import { Link } from "gatsby";
import * as React from "react";

import { Post as PostType } from "../interfaces/post";

export type PostItem = Pick<PostType, "excerpt" | "frontmatter" | "id"> & {
  slug: string;
};

export interface PostProps {
  post: PostItem;
  onClick?: () => void;
  titleRenderer?: (
    title: PostItem["frontmatter"]["title"],
    post: PostItem,
  ) => React.ReactElement;
  excerptRenderer?: (
    excerpt: PostItem["excerpt"],
    post: PostItem,
  ) => React.ReactElement;
  className?: string;
}

/** 博文列表栏的博文简介 */
const Post = (props: PostProps) => {
  const {
    post,
    onClick,
    titleRenderer,
    excerptRenderer,
    className = "",
  } = props;
  const { slug, frontmatter, excerpt } = post;
  const {
    categories = [],
    date: dateString,
    updated: updatedDateString,
    tags = [],
    title,
  } = frontmatter;

  const date = new Date(dateString);
  const updatedDate = updatedDateString ? new Date(updatedDateString) : date;

  return (
    <Link
      to={`/posts/${slug}`}
      onClick={onClick}
      className={`flex flex-col gap-1.5 rounded-lg px-4 py-3 ${className}`}
    >
      {categories.length && (
        <div className="line-clamp-1 text-sm font-medium text-foreground opacity-80">
          {categories[0]}
        </div>
      )}
      <h1 title={title} className="line-clamp-3 font-bold">
        {titleRenderer?.(title, post) || title}
      </h1>
      {excerpt && (
        <p title={excerpt}>{excerptRenderer?.(excerpt, post) || excerpt}</p>
      )}
      <div className="flex text-sm text-foreground-secondary">
        <div
          title={`首次发布于：${date.toString()}\n最后更新于：${updatedDate.toString()}`}
          className="line-clamp-1"
        >
          {dayjs(date).format("MM月DD日YYYY年")}
        </div>
        {tags.length && (
          <div
            title={tags.join(" ")}
            className="line-clamp-1 flex-1 before:mx-1 before:content-['•']"
          >
            {tags.join(" ")}
          </div>
        )}
      </div>
    </Link>
  );
};

export default Post;
