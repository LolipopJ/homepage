import dayjs from "dayjs";
import { HeadFC, PageProps } from "gatsby";
import * as React from "react";

import Post, { PostProps } from "../components/post";
import SEO from "../components/seo";
import { NUMBER_LETTER } from "../constants/utils";
import useAllMdx from "../hooks/useAllMdx";

const IndexPage: React.FC<PageProps> = () => {
  const posts = useAllMdx();

  const postsWithYear = React.useMemo(() => {
    const result: Record<number, PostProps["post"][]> = {};
    posts.forEach((post) => {
      const postYear = dayjs(post.frontmatter.date).year();
      if (Array.isArray(result[postYear])) {
        result[postYear].push(post);
      } else {
        result[postYear] = [post];
      }
    });
    return result;
  }, [posts]);

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
            <ol className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {posts.map((post) => {
                return (
                  <li key={post.fields.slug}>
                    <Post post={post} size="large" showBanner />
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
