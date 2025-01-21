import { Link } from "gatsby";
import * as React from "react";

import { PostBase } from "../interfaces/post";

export interface PostProps {
  post: Pick<PostBase, "categories" | "date" | "tags" | "title">;
  postPath: string;
  className?: string;
}

const Post = (props: PostProps) => {
  const { post, postPath, className = "" } = props;
  const { categories = [], date, tags = [], title } = post;

  return (
    <Link
      to={`/posts/${postPath}`}
      className={`item-selectable flex flex-col rounded-lg px-4 py-3 ${className}`}
    >
      {categories.length && (
        <div className="mb-1 line-clamp-1 text-sm font-medium">
          {categories.join(" / ")}
        </div>
      )}
      <div title={title} className="mb-1.5 line-clamp-3 font-bold">
        {title}
      </div>
      <div className="flex text-sm text-neutral-100/60">
        <div title={new Date(date).toString()} className="line-clamp-1">
          {new Date(date).toLocaleDateString()}
        </div>
        {tags.length && (
          <>
            <div className="mx-1 select-none">·</div>
            <div title={tags.join(" ")} className="line-clamp-1 flex-1">
              {tags.slice(0, 2).join(" ")}
              {tags.length > 2 && " +"}
            </div>
          </>
        )}
      </div>
    </Link>
  );
};

export default Post;
