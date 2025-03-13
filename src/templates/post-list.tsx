import { graphql, HeadProps, PageProps } from "gatsby";
import * as React from "react";

import Post, { type PostType } from "../components/post";
import SEO from "../components/seo";

interface PostListPageData {
  allMdx: { nodes: PostType[] };
}

interface PostListPageContext {
  ids: string[];
  category?: string;
  tag?: string;
}

const PostListTemplate: React.FC<
  PageProps<PostListPageData, PostListPageContext>
> = ({ data }) => {
  const {
    allMdx: { nodes: posts = [] },
  } = data;
  return (
    <ol className="mb-8 grid grid-cols-1 gap-4">
      {posts.map((post) => (
        <li key={post.fields.slug}>
          <Post post={post} size="large" />
        </li>
      ))}
    </ol>
  );
};

export const query = graphql`
  query ($ids: [String]) {
    allMdx(
      sort: { frontmatter: { date: DESC } }
      filter: { id: { in: $ids } }
    ) {
      nodes {
        excerpt(pruneLength: 200)
        fields {
          slug
        }
        frontmatter {
          categories
          tags
          title
          date
          updated
          timeliness
        }
      }
    }
  }
`;

export const Head = ({
  pageContext,
}: HeadProps<PostListPageData, PostListPageContext>) => {
  const { category, tag } = pageContext;
  return <SEO title={category ?? tag ?? "博客列表"} />;
};

export default PostListTemplate;
