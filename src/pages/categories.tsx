import { HeadFC, Link, PageProps } from "gatsby";
import * as React from "react";

import SEO from "../components/seo";
import useAllMdx from "../hooks/useAllMdx";

const Categories: React.FC<PageProps> = () => {
  const posts = useAllMdx();

  const categories = React.useMemo(() => {
    const result: Record<string, number> = {};
    posts.forEach((node: { frontmatter: { categories: string[] } }) => {
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
  }, [posts]);

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
