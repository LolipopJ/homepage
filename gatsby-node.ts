import path from "path";

import { Post, PostInternal } from "./src/interfaces/post";
import { parseFilePathToPostSlug } from "./src/utils/post";

const postTemplate = path.resolve("./src/templates/post.tsx");
const postListTemplate = path.resolve("./src/templates/post-list.tsx");

interface PostNode extends Pick<Post, "excerpt" | "frontmatter" | "id"> {
  internal: Pick<PostInternal, "contentFilePath">;
  slug: string;
}

// @ts-expect-error: ignored
exports.createPages = async function ({ actions, graphql }) {
  const { data } = await graphql(`
    query {
      allMdx(
        sort: { frontmatter: { date: DESC } }
        filter: {
          internal: {
            contentFilePath: { regex: "//blog/posts/|/blog/about.mdx/" }
          }
        }
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

  const postsFilteredByCategory: Record<string, PostNode[]> = {};
  const postsFilteredByTag: Record<string, PostNode[]> = {};

  data.allMdx.nodes.forEach((node: PostNode) => {
    const contentFilePath = node.internal.contentFilePath;
    const slug = parseFilePathToPostSlug(contentFilePath);
    const postPagePath = contentFilePath.endsWith("/blog/about.mdx")
      ? "/about"
      : `/posts/${slug}`;
    actions.createPage({
      path: postPagePath,
      component: `${postTemplate}?__contentFilePath=${contentFilePath}`,
      context: { slug },
    });

    node.slug = slug;
    (node.frontmatter.categories ?? []).forEach((category) => {
      if (Array.isArray(postsFilteredByCategory[category])) {
        postsFilteredByCategory[category].push(node);
      } else {
        postsFilteredByCategory[category] = [node];
      }
    });
    (node.frontmatter.tags ?? []).forEach((tag) => {
      if (Array.isArray(postsFilteredByTag[tag])) {
        postsFilteredByTag[tag].push(node);
      } else {
        postsFilteredByTag[tag] = [node];
      }
    });
  });

  Object.entries(postsFilteredByCategory).forEach(([category, posts]) => {
    const postListPagePath = `/categories/${category}`;
    actions.createPage({
      path: postListPagePath,
      component: postListTemplate,
      context: { posts, category },
    });
  });

  Object.entries(postsFilteredByTag).forEach(([tag, posts]) => {
    const postListPagePath = `/tags/${tag}`;
    actions.createPage({
      path: postListPagePath,
      component: postListTemplate,
      context: { posts, tag },
    });
  });
};
