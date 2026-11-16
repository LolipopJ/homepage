import {
  type BuildArgs,
  type CreateNodeArgs,
  type CreatePagesArgs,
  type CreateSchemaCustomizationArgs,
  type CreateWebpackConfigArgs,
} from "gatsby";
import path from "path";

import { buildPostCoverTypeDefs } from "./plugins/post-cover";
import {
  generateSitemaps,
  type MdxQueryResult,
  type SitePageQueryResult,
} from "./plugins/sitemap";
import { assertNoRouteConflicts, resolveBlogContent } from "./src/utils/post";

const isProd = process.env.NODE_ENV === "production";
const BLOG_ROOT = path.resolve("./blog");

export const onCreateWebpackConfig = ({
  actions,
  getConfig,
}: CreateWebpackConfigArgs) => {
  const config = getConfig();
  if (!config?.plugins) return;

  // Remove ESLintWebpackPlugin injected by Gatsby or other plugins
  // to avoid conflict with ESLint flat configuration
  config.plugins = config.plugins.filter(
    (p: object) => p?.constructor?.name !== "ESLintWebpackPlugin",
  );

  actions.replaceWebpackConfig(config);
};

export const createSchemaCustomization = ({
  actions,
  schema,
}: CreateSchemaCustomizationArgs) => {
  actions.createTypes(buildPostCoverTypeDefs(schema, BLOG_ROOT));
};

export const onCreateNode = ({ node, actions }: CreateNodeArgs) => {
  const { createNodeField } = actions;
  if (node.internal.type === "Mdx") {
    const contentFilePath = String(node.internal.contentFilePath);
    const resolved = resolveBlogContent(
      path.relative(BLOG_ROOT, contentFilePath),
    );
    if (!resolved) return;

    createNodeField({
      node,
      name: "slug",
      value: resolved.slug,
    });

    createNodeField({
      node,
      name: "isPublic",
      value: resolved.isPublic,
    });

    createNodeField({
      node,
      name: "isDraft",
      value: resolved.isDraft,
    });
  }
};

export const createPages = async function ({
  actions,
  graphql,
  reporter,
}: CreatePagesArgs) {
  const postTemplate = path.resolve("./src/templates/post.tsx");
  const postListTemplate = path.resolve("./src/templates/post-list.tsx");

  const { data, errors } = await graphql<{
    allMdx: {
      nodes: (Pick<MdxNode, "fields" | "id"> & {
        frontmatter: Pick<
          MdxNode["frontmatter"],
          "banner" | "categories" | "tags"
        >;
        internal: Pick<MdxNode["internal"], "contentFilePath">;
      })[];
    };
  }>(`
    query {
      allMdx(sort: { frontmatter: { date: DESC } }) {
        nodes {
          fields {
            slug
            isPublic
          }
          frontmatter {
            banner {
              publicURL
            }
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

  if (errors || !data) {
    reporter.panicOnBuild(
      "[content-routing] Failed to query MDX nodes for page creation",
      errors,
    );
    return;
  }

  const routableEntries = data.allMdx.nodes.flatMap((node) => {
    const resolved = resolveBlogContent(
      path.relative(BLOG_ROOT, node.internal.contentFilePath),
    );
    return resolved ? [{ node, resolved }] : [];
  });

  try {
    assertNoRouteConflicts(
      routableEntries.map(({ node, resolved }) => ({
        pagePath: resolved.pagePath,
        sourcePath: node.internal.contentFilePath,
      })),
    );
  } catch (error) {
    reporter.panicOnBuild(
      error instanceof Error ? error.message : String(error),
    );
    return;
  }

  const postsFilteredByCategory: Record<string, string[]> = {};
  const postsFilteredByTag: Record<string, string[]> = {};

  routableEntries.forEach(({ node, resolved }) => {
    // Create post pages through template
    actions.createPage({
      path: resolved.pagePath,
      component: `${postTemplate}?__contentFilePath=${node.internal.contentFilePath}`,
      context: {
        id: node.id,
      },
    });

    // Skip drafts when adding to category/tag lists in production
    const shouldIncludeInLists = !isProd || resolved.isPublic;

    // Filter posts by category
    if (shouldIncludeInLists) {
      (node.frontmatter.categories ?? []).forEach((category) => {
        if (Array.isArray(postsFilteredByCategory[category])) {
          postsFilteredByCategory[category].push(node.id);
        } else {
          postsFilteredByCategory[category] = [node.id];
        }
      });
    }

    // Filter posts by tag
    if (shouldIncludeInLists) {
      (node.frontmatter.tags ?? []).forEach((tag) => {
        if (Array.isArray(postsFilteredByTag[tag])) {
          postsFilteredByTag[tag].push(node.id);
        } else {
          postsFilteredByTag[tag] = [node.id];
        }
      });
    }
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

export const onPostBuild = async function ({ graphql, reporter }: BuildArgs) {
  reporter.info(
    "[sitemap] Generating sitemaps for blog.towind.cn and lolipopj.github.io...",
  );

  const { data, errors } = await graphql<{
    allSitePage: {
      nodes: SitePageQueryResult[];
    };
    allMdx: {
      nodes: MdxQueryResult[];
    };
  }>(`
    query SitemapQuery {
      allSitePage {
        nodes {
          path
        }
      }
      allMdx {
        nodes {
          fields {
            slug
            isPublic
            isDraft
          }
          frontmatter {
            date
            updated
          }
          internal {
            contentFilePath
          }
        }
      }
    }
  `);

  if (errors || !data) {
    reporter.panicOnBuild(
      "[sitemap] Failed to query data for sitemap generation",
      errors,
    );
    return;
  }

  const publicDir = path.resolve("./public");
  await generateSitemaps(
    publicDir,
    data.allSitePage.nodes,
    data.allMdx.nodes,
    BLOG_ROOT,
  );

  reporter.info("[sitemap] Successfully generated sitemaps.");
};
