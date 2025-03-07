import { HeadProps, PageProps } from "gatsby";
import * as React from "react";

import Post, { type PostProps } from "../components/post";
import SEO from "../components/seo";

interface PostPageContext {
  posts: PostProps["post"][];
  category?: string;
  tag?: string;
}

const PostListTemplate: React.FC<PageProps<object, PostPageContext>> = ({
  pageContext,
}) => {
  const { posts = [] } = pageContext;
  return (
    <ol className="mb-8 grid grid-cols-1 gap-4">
      {posts.map((post) => (
        <li key={post.id}>
          <Post post={post} size="large" />
        </li>
      ))}
    </ol>
  );
};

export const Head = ({ pageContext }: HeadProps<object, PostPageContext>) => {
  const { category, tag } = pageContext;
  return <SEO title={category ?? tag ?? "博客列表"} />;
};

export default PostListTemplate;
