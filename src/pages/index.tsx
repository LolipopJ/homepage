import { graphql, HeadFC, PageProps, useStaticQuery } from "gatsby";
import * as React from "react";

import Post, { PostProps } from "../components/post";
import SEO from "../components/seo";
import { NUMBER_LETTER } from "../constants/utils";
import { parseFilePathToPostSlug } from "../utils/post";

const IndexPage: React.FC<PageProps> = () => {
  const {
    allMdx: { nodes },
  } = useStaticQuery(graphql`
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
  const postsWithYear = React.useMemo(() => {
    const result: Record<number, PostProps["post"][]> = {};
    // @ts-expect-error: ignored
    nodes.forEach((node) => {
      const post = {
        ...node,
        slug: parseFilePathToPostSlug(node.internal.contentFilePath),
      };
      const postYear = new Date(node.frontmatter.date).getFullYear();
      Array.isArray(result[postYear])
        ? result[postYear].push(post)
        : (result[postYear] = [post]);
    });
    return result;
  }, [nodes]);

  return (
    <div className="m-auto max-w-4xl px-8">
      {Object.entries(postsWithYear)
        .reverse()
        .map(([year, posts]) => (
          <div>
            <div className="mb-2 px-4">
              <span className="text-lg font-bold">
                {year.split("").map((num) => NUMBER_LETTER[Number(num)])}
              </span>
              <span className="text-sm text-foreground-secondary before:mx-2 before:content-['/']">
                {posts.length} 篇
              </span>
            </div>
            <ol className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {posts.map((post) => {
                return (
                  <li key={post.id} className="">
                    <Post post={post} className="item-selectable" />
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
    </div>
  );
};

export default IndexPage;

export const Head: HeadFC = () => <SEO title="主页" />;
