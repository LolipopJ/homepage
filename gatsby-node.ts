import { type CreateNodeArgs, type CreatePagesArgs } from "gatsby";
import path from "path";

import { parseFilePathToPostSlug } from "./src/utils/post";

const postTemplate = path.resolve("./src/templates/post.tsx");
const postListTemplate = path.resolve("./src/templates/post-list.tsx");

export const onCreateNode = ({ node, actions }: CreateNodeArgs) => {
  const { createNodeField } = actions;
  if (node.internal.type === "Mdx") {
    createNodeField({
      node,
      name: "slug",
      value: parseFilePathToPostSlug(String(node.internal.contentFilePath)),
    });
  }
};

export const createPages = async function ({
  actions,
  graphql,
}: CreatePagesArgs) {
  const { data } = await graphql<{
    allMdx: {
      nodes: (Pick<MdxNode, "fields" | "id"> & {
        frontmatter: Pick<MdxNode["frontmatter"], "categories" | "tags">;
        internal: Pick<MdxNode["internal"], "contentFilePath">;
      })[];
    };
  }>(`
    query {
      allMdx(
        sort: { frontmatter: { date: DESC } }
        filter: {
          internal: {
            contentFilePath: {
              regex: "//blog/posts/|/blog/drafts/|/blog/about-me.mdx/"
            }
          }
        }
      ) {
        nodes {
          fields {
            slug
          }
          frontmatter {
            categories
            tags
          }
          id
          internal {
            contentFilePath
          }
        }
      }
    }
  `);

  const postsFilteredByCategory: Record<string, string[]> = {};
  const postsFilteredByTag: Record<string, string[]> = {};

  data?.allMdx.nodes.forEach((node) => {
    const slug = node.fields.slug;
    const path = slug === "about-me" ? "/about-me" : `/posts/${slug}`;

    // Create post pages through template
    actions.createPage({
      path,
      component: `${postTemplate}?__contentFilePath=${node.internal.contentFilePath}`,
      context: {
        id: node.id,
      },
    });

    // Filter posts by category
    (node.frontmatter.categories ?? []).forEach((category) => {
      if (Array.isArray(postsFilteredByCategory[category])) {
        postsFilteredByCategory[category].push(node.id);
      } else {
        postsFilteredByCategory[category] = [node.id];
      }
    });

    // Filter posts by tag
    (node.frontmatter.tags ?? []).forEach((tag) => {
      if (Array.isArray(postsFilteredByTag[tag])) {
        postsFilteredByTag[tag].push(node.id);
      } else {
        postsFilteredByTag[tag] = [node.id];
      }
    });
  });

  // Create category pages through filtered posts
  Object.entries(postsFilteredByCategory).forEach(([category, ids]) => {
    const postListPagePath = `/categories/${category}`;
    actions.createPage({
      path: postListPagePath,
      component: postListTemplate,
      context: { ids, category },
    });
  });

  // Create tag pages through filtered posts
  Object.entries(postsFilteredByTag).forEach(([tag, ids]) => {
    const postListPagePath = `/tags/${tag}`;
    actions.createPage({
      path: postListPagePath,
      component: postListTemplate,
      context: { ids, tag },
    });
  });
};
