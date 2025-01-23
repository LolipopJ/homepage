import dayjs from "dayjs";
import { Link } from "gatsby";
import * as React from "react";

import { PostBase } from "../interfaces/post";

export interface PostProps {
  post: Pick<PostBase, "categories" | "date" | "updated" | "tags" | "title">;
  postPath: string;
  className?: string;
}

/** 博文列表栏的博文简介 */
const Post = (props: PostProps) => {
  const { post, postPath, className = "" } = props;
  const {
    categories = [],
    date: dateString,
    updated: updatedDateString,
    tags = [],
    title,
  } = post;

  const date = new Date(dateString);
  const updatedDate = updatedDateString ? new Date(updatedDateString) : date;

  return (
    <Link
      to={`/posts/${postPath}`}
      className={`item-selectable flex flex-col rounded-lg px-4 py-3 ${className}`}
    >
      {categories.length && (
        <div className="mb-1 line-clamp-1 text-sm font-medium text-foreground opacity-80">
          {categories[0]}
        </div>
      )}
      <div title={title} className="mb-1.5 line-clamp-3 font-bold">
        {title}
      </div>
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
