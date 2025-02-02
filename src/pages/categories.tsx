import { graphql, HeadFC, Link, PageProps, useStaticQuery } from "gatsby";
import * as React from "react";

import SEO from "../components/seo";

const Categories: React.FC<PageProps> = (props) => {
  const {
    allMdx: { nodes },
  } = useStaticQuery(graphql`
    query {
      allMdx(
        filter: { internal: { contentFilePath: { regex: "//blog/posts//" } } }
      ) {
        nodes {
          frontmatter {
            categories
          }
        }
      }
    }
  `);
  const categories = React.useMemo(() => {
    const result: Record<string, number> = {};
    nodes.forEach((node: { frontmatter: { categories: string[] } }) => {
      const postCategories = node.frontmatter.categories ?? [];
      postCategories.forEach((category) => {
        if (result[category]) {
          result[category] += 1;
        } else {
          result[category] = 1;
        }
      });
    });
    return Object.entries(result).sort((a, b) => b[1] - a[1]);
  }, [nodes]);

  return (
    <div>
      <ol className="flex flex-wrap gap-3">
        {categories.map(([categoryName, postCount]) => {
          return (
            <li key={categoryName}>
              <Link
                to={`/categories/${encodeURIComponent(categoryName)}`}
                className="item-selectable rounded-md px-3 py-2"
              >
                <span className="font-bold">{categoryName}</span>
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

export default Categories;

export const Head: HeadFC = () => <SEO title="所有分类" />;
