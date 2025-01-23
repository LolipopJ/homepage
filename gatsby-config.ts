import dotenv from "dotenv";
import type { GatsbyConfig } from "gatsby";

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
  // More easily incorporate content into your pages through automatic TypeScript type generation and better GraphQL IntelliSense.
  // If you use VSCode you can also use the GraphQL plugin
  // Learn more at: https://gatsby.dev/graphql-typegen
  graphqlTypegen: true,
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
        name: "about",
        path: "./blog/about.mdx",
      },
      __key: "about",
    },
    {
      resolve: "gatsby-plugin-mdx",
      options: {
        extensions: [".mdx", ".md"],
        gatsbyRemarkPlugins: [
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
      },
    },
    {
      // This plugin must be placed last in your list of plugins to ensure that it can query all the GraphQL data
      resolve: `gatsby-plugin-algolia`,
      options: {
        appId: process.env.ALGOLIA_APP_ID,
        // Use Admin API key without GATSBY_ prefix, so that the key isn't exposed in the application
        // Tip: use Search API key with GATSBY_ prefix to access the service from within components
        apiKey: process.env.ALGOLIA_API_KEY,
        indexName: process.env.ALGOLIA_INDEX_NAME,
        queries: [
          {
            query: `
query {
  allMdx(filter: {internal: {contentFilePath: {regex: "//blog/posts//"}}}) {
    nodes {
      excerpt
      frontmatter {
        categories
        tags
        title
      }
      id
      internal {
        contentDigest
      }
    }
  }
}
`,
            queryVariables: {},
            transformer: ({ data }) => {
              console.log("data", data);
              return data.allMdx.nodes;
            },
            indexName: process.env.ALGOLIA_INDEX_NAME,
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
