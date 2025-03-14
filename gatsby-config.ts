import dotenv from "dotenv";
import type { GatsbyConfig } from "gatsby";
import remarkGfm from "remark-gfm";

import { type AlgoliaPostItem } from "./src/components/algolia-search";
import { ALGOLIA_APP_ID, ALGOLIA_INDEX_NAME } from "./src/constants/algolia";

dotenv.config({
  path: [".env", `.env.${process.env.NODE_ENV}`],
});

const config: GatsbyConfig = {
  siteMetadata: {
    title: "Lolipop's Studio",
    description:
      "Personal blog of Lolipop, share knowledge about software / frontend development.",
    siteUrl: "https://lolipopj.github.io/blog",
  },
  plugins: [
    "gatsby-plugin-layout",
    "gatsby-plugin-postcss",
    "gatsby-plugin-sitemap",
    "gatsby-plugin-image",
    "gatsby-plugin-sharp",
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "pages",
        path: "./src/pages/",
      },
      __key: "pages",
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "posts",
        path: "./blog/posts/",
      },
      __key: "posts",
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "drafts",
        path: "./blog/drafts/",
      },
      __key: "drafts",
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "about-me",
        path: "./blog/about-me.mdx",
      },
      __key: "about-me",
    },
    {
      resolve: "gatsby-plugin-mdx",
      options: {
        extensions: [".mdx", ".md"],
        gatsbyRemarkPlugins: [
          {
            resolve: "gatsby-remark-images",
            options: {
              maxWidth: 624,
            },
          },
          {
            resolve: "gatsby-remark-copy-linked-files",
            options: {
              destinationDir: (file: { name: string; hash: string }) =>
                `images/${file.name}+${file.hash}`,
            },
          },
          "gatsby-remark-responsive-iframe",
          {
            resolve: "gatsby-remark-prismjs",
            options: {
              classPrefix: "language-",
              inlineCodeMarker: null,
              aliases: {},
              showLineNumbers: false,
              noInlineHighlight: false,
              languageExtensions: [],
              prompt: {
                user: "root",
                host: "localhost",
                global: false,
              },
              escapeEntities: {},
            },
          },
        ],
        mdxOptions: {
          remarkPlugins: [remarkGfm],
        },
      },
    },
    {
      resolve: "gatsby-plugin-algolia",
      options: {
        appId: ALGOLIA_APP_ID,
        apiKey: process.env.ALGOLIA_API_KEY,
        indexName: ALGOLIA_INDEX_NAME,
        queries: [
          {
            query: `
              query {
                allMdx(
                  sort: { frontmatter: { date: DESC} }
                  filter: {
                    internal: {
                      contentFilePath: { regex: "//blog/posts//" }
                    }
                  }
                ) {
                  nodes {
                    excerpt(pruneLength: 200)
                    fields {
                      slug
                    }
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
                      contentDigest
                    }
                  }
                }
              }`,
            queryVariables: {},
            transformer: ({
              data,
            }: {
              data: {
                allMdx: {
                  nodes: AlgoliaPostItem[];
                };
              };
            }) => data.allMdx.nodes,
            indexName: ALGOLIA_INDEX_NAME,
            settings: {},
            mergeSettings: false,
          },
        ],
        chunkSize: 10000,
        settings: {},
        mergeSettings: false,
        concurrentQueries: true,
        dryRun: false,
        continueOnFailure: false,
        algoliasearchOptions: { timeouts: { connect: 1, read: 30, write: 30 } },
      },
    },
  ],
};

export default config;
