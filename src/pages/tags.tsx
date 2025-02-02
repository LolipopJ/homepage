import { graphql, HeadFC, Link, PageProps, useStaticQuery } from "gatsby";
import * as React from "react";

import SEO from "../components/seo";

const Tags: React.FC<PageProps> = (props) => {
  const {
    allMdx: { nodes },
  } = useStaticQuery(graphql`
    query {
      allMdx(
        filter: { internal: { contentFilePath: { regex: "//blog/posts//" } } }
      ) {
        nodes {
          frontmatter {
            tags
          }
        }
      }
    }
  `);
  const tags = React.useMemo(() => {
    const result: Record<string, number> = {};
    nodes.forEach((node: { frontmatter: { tags: string[] } }) => {
      const postTags = node.frontmatter.tags ?? [];
      postTags.forEach((tag) => {
        if (result[tag]) {
          result[tag] += 1;
        } else {
          result[tag] = 1;
        }
      });
    });
    return Object.entries(result).sort((a, b) => b[1] - a[1]);
  }, [nodes]);

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
