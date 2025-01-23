import path from "path";

import { parseFilePathToPostSlug } from "./src/utils/post";

const postTemplate = path.resolve(`./src/templates/post.tsx`);

// @ts-expect-error: ignored
exports.createPages = async function ({ actions, graphql }) {
  const { data } = await graphql(`
    query {
      allMdx(
        filter: {
          internal: {
            contentFilePath: { regex: "//blog/posts/|/blog/about.mdx/" }
          }
        }
      ) {
        nodes {
          id
          body
          internal {
            contentFilePath
          }
        }
      }
    }
  `);
  data.allMdx.nodes.forEach(
    (node: {
      id: string;
      body: string;
      internal: { contentFilePath: string };
    }) => {
      const contentFilePath = node.internal.contentFilePath;
      const path = contentFilePath.endsWith("/blog/about.mdx")
        ? "/about"
        : `/posts/${parseFilePathToPostSlug(contentFilePath)}`;

      actions.createPage({
        path,
        component: `${postTemplate}?__contentFilePath=${contentFilePath}`,
        context: { id: node.id, body: node.body },
      });
    },
  );
};
