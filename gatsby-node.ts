import path from "path";

import { IS_DEVELOPMENT } from "./src/constants/utils";
import { type Post } from "./src/hooks/useAllMdx";
import { getAllMdxQueryString } from "./src/utils/graphql";
import { parseFilePathToPostSlug } from "./src/utils/post";

const postTemplate = path.resolve("./src/templates/post.tsx");
const postListTemplate = path.resolve("./src/templates/post-list.tsx");

// @ts-expect-error: ignored
export const createPages = async function ({ actions, graphql }) {
  const { data } = await graphql(`
    query {
      ${getAllMdxQueryString({ sortByDate: "DESC", includeAbout: true, includeDrafts: IS_DEVELOPMENT, includePosts: true, excerpt: 200 })}
    }
  `);

  const postsFilteredByCategory: Record<string, Post[]> = {};
  const postsFilteredByTag: Record<string, Post[]> = {};

  data.allMdx.nodes.forEach((node: Post) => {
    const contentFilePath = node.internal.contentFilePath;
    const slug = parseFilePathToPostSlug(contentFilePath);
    node.slug = slug;

    const postPagePath = /\/blog\/about\.mdx$/.test(contentFilePath)
      ? "/about"
      : `/posts/${slug}`;

    // Create post pages through template
    actions.createPage({
      path: postPagePath,
      component: `${postTemplate}?__contentFilePath=${contentFilePath}`,
      context: { slug },
    });

    // Filter posts by category
    (node.frontmatter.categories ?? []).forEach((category) => {
      if (Array.isArray(postsFilteredByCategory[category])) {
        postsFilteredByCategory[category].push(node);
      } else {
        postsFilteredByCategory[category] = [node];
      }
    });

    // Filter posts by tag
    (node.frontmatter.tags ?? []).forEach((tag) => {
      if (Array.isArray(postsFilteredByTag[tag])) {
        postsFilteredByTag[tag].push(node);
      } else {
        postsFilteredByTag[tag] = [node];
      }
    });
  });

  // Create category pages through filtered posts
  Object.entries(postsFilteredByCategory).forEach(([category, posts]) => {
    const postListPagePath = `/categories/${category}`;
    actions.createPage({
      path: postListPagePath,
      component: postListTemplate,
      context: { posts, category },
    });
  });

  // Create tag pages through filtered posts
  Object.entries(postsFilteredByTag).forEach(([tag, posts]) => {
    const postListPagePath = `/tags/${tag}`;
    actions.createPage({
      path: postListPagePath,
      component: postListTemplate,
      context: { posts, tag },
    });
  });
};
