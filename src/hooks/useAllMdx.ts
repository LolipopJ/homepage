import { graphql, useStaticQuery } from "gatsby";

import { parseFilePathToPostSlug } from "../utils/post";

export interface MdxNode {
  excerpt: string;
  frontmatter: {
    categories: string[];
    tags: string[];
    title: string;
    date: string;
    updated: string;
    timeliness: boolean;
  };
  id: string;
  internal: {
    contentFilePath: string;
  };
}

export interface Post extends MdxNode {
  slug: string;
}

export const useAllMdx = () => {
  const {
    allMdx: { nodes },
  } = useStaticQuery<{
    allMdx: { nodes: MdxNode[] };
  }>(graphql`
    query {
      allMdx(
        sort: { frontmatter: { date: DESC } }
        filter: { internal: { contentFilePath: { regex: "//blog/posts//" } } }
      ) {
        nodes {
          excerpt(pruneLength: 200)
          frontmatter {
            categories
            tags
            title
            date
            updated
            timeliness
          }
          id
          internal {
            contentFilePath
          }
        }
      }
    }
  `);

  const posts: Post[] = nodes.map((node) => ({
    ...node,
    slug: parseFilePathToPostSlug(node.internal.contentFilePath),
  }));

  return posts;
};

export default useAllMdx;
