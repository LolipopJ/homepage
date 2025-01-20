import * as React from "react";

import { BlogFrontmatter } from "../interfaces/blog";

export interface PostProps
  extends Partial<Pick<BlogFrontmatter, "categories" | "date" | "tags">>,
    Pick<BlogFrontmatter, "title"> {
  className?: string;
}

const Post = (props: PostProps) => {
  const { categories = [], date, tags = [], title, className } = props;
};

export default Post;
