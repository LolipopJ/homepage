import { HeadFC, Link, PageProps } from "gatsby";
import * as React from "react";

import SEO from "../components/seo";
import useAllMdx from "../hooks/useAllMdx";

const Tags: React.FC<PageProps> = () => {
  const posts = useAllMdx();

  const tags = React.useMemo(() => {
    const result: Record<string, number> = {};
    posts.forEach((post) => {
      const postTags = post.frontmatter.tags ?? [];
      postTags.forEach((tag) => {
        if (result[tag]) {
          result[tag] += 1;
        } else {
          result[tag] = 1;
        }
      });
    });
    return Object.entries(result).sort((a, b) => b[1] - a[1]);
  }, [posts]);

  return (
    <div>
      <ol className="flex flex-wrap gap-3">
        {tags.map(([tagName, postCount]) => {
          return (
            <li key={tagName}>
              <Link
                to={`/tags/${encodeURIComponent(tagName)}`}
                className="item-selectable rounded-md px-3 py-2"
              >
                <span className="font-bold">{tagName}</span>
                <span className="text-sm text-foreground-secondary before:mx-1 before:content-['/']">
                  {postCount} 篇
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default Tags;

export const Head: HeadFC = () => <SEO title="所有标签" />;
