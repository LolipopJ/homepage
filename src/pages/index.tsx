import dayjs from "dayjs";
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
      const postYear = dayjs(node.frontmatter.date).year();
      if (Array.isArray(result[postYear])) {
        result[postYear].push(post);
      } else {
        result[postYear] = [post];
      }
    });
    return result;
  }, [nodes]);

  return (
    <div>
      {Object.entries(postsWithYear)
        .reverse()
        .map(([year, posts]) => (
          <div key={year} className="mb-12">
            <div className="mb-4 px-4">
              <span className="text-xl font-bold text-primary-light">
                {year.split("").map((num) => NUMBER_LETTER[Number(num)])}
              </span>
              <span className="text-sm text-foreground-secondary before:mx-2 before:content-['/']">
                {posts.length} 篇
              </span>
            </div>
            <ol className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {posts.map((post) => {
                return (
                  <li key={post.id}>
                    <Post post={post} size="large" />
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
