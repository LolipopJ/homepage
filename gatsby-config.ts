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
      "Homepage and blog of Lolipop, share knowledge about software / frontend development.",
    siteUrl: "https://blog.towind.fun",
  },
  flags: {
    // DEV_SSR: true,
    // FAST_DEV: true,
    // PRESERVE_FILE_DOWNLOAD_CACHE: true,
    // DETECT_NODE_MUTATIONS: true,
  },
  // graphqlTypegen: true,
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
          // 压缩使用到的图片文件，放置到 /public/static 目录下
          {
            resolve: "gatsby-remark-images",
            options: {
              maxWidth: 624,
            },
          },
          // 将使用到的其它类型文件放置到 /public/static 目录下
          {
            resolve: "gatsby-remark-copy-linked-files",
            options: {
              destinationDir: (file: { name: string; hash: string }) => {
                return `static/${file.hash}/${file.name}`;
              },
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
      resolve: "gatsby-plugin-manifest",
      options: {
        name: "Lolipop's Studio",
        short_name: "Lolipop's Studio",
        lang: "zh-CN",
        start_url: "/",
        background_color: "#f7f0eb",
        theme_color: "#438579",
        display: "standalone",
        icon: "static/icons/favicon.png",
      },
    },
    {
      resolve: "gatsby-plugin-feed",
      options: {
        feeds: [
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
                    body
                    excerpt(pruneLength: 200)
                    fields {
                      slug
                    }
                    frontmatter {
                      banner {
                        publicURL
                      }
                      categories
                      tags
                      title
                      date
                      updated
                      timeliness
                    }
                  }
                }
              }`,
            serialize: ({
              query: { site, allMdx },
            }: {
              query: {
                site: { siteMetadata: SiteMetadata };
                allMdx: {
                  nodes: Pick<
                    MdxNode,
                    "body" | "excerpt" | "fields" | "frontmatter"
                  >[];
                };
              };
            }) => {
              return allMdx.nodes.map((node) => {
                return Object.assign({}, node.frontmatter, {
                  description: node.excerpt,
                  date: node.frontmatter.date,
                  url: `${site.siteMetadata.siteUrl}/posts/${node.fields.slug}`,
                  guid: node.fields.slug,
                  custom_elements: [
                    {
                      "content:original-text": node.body,
                    },
                    {
                      "content:updated-at": new Date(
                        String(node.frontmatter.updated),
                      ).toISOString(),
                    },
                  ],
                });
              });
            },
            output: "/rss.xml",
            title: "Lolipop's Studio | RSS Feed",
          },
        ],
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
                      banner {
                        publicURL
                      }
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
