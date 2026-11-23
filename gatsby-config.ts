import dotenv from "dotenv";
import type { GatsbyConfig } from "gatsby";
import remarkGfm from "remark-gfm";
import remarkGithubAlerts from "remark-github-alerts";

import { remarkRelativePostLinks } from "./plugins/remark-relative-post-links";
import { remarkSkipCodeBlock } from "./plugins/remark-skip-code-block";
import { type AlgoliaPostItem } from "./src/components/algolia-search";
import { ALGOLIA_APP_ID, ALGOLIA_INDEX_NAME } from "./src/constants/algolia";
import { getCanonicalUrl, getPostPath } from "./src/utils/post";

dotenv.config({
  path: [".env", `.env.${process.env.NODE_ENV}`],
});

const config: GatsbyConfig = {
  siteMetadata: {
    title: "Lolipop's Studio",
    owner: "Lolipop",
    description:
      "Homepage and blog of Lolipop, share my thoughts about software development & AI technology.",
    siteUrl: "https://blog.towind.cn",
  } as SiteMetadata,
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
    "gatsby-plugin-image",
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",
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
        name: "blog",
        path: "./blog/",
      },
      __key: "blog",
    },
    {
      resolve: "gatsby-plugin-mdx",
      options: {
        extensions: [".mdx", ".md"],
        mdxOptions: {
          remarkPlugins: [
            remarkGithubAlerts,
            remarkGfm,
            remarkSkipCodeBlock,
            remarkRelativePostLinks,
          ],
        },
        gatsbyRemarkPlugins: [
          // 按文章设置处理正文图片并复制附件
          {
            resolve: "gatsby-remark-post-images",
            options: {
              maxWidth: 624,
            },
          },
          // 响应式嵌入内容（如 YouTube 视频）
          "gatsby-remark-responsive-iframe",
          // 添加代码高亮
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
      resolve: "gatsby-plugin-manifest",
      options: {
        name: "Lolipop's Studio",
        short_name: "Lolipop's Studio",
        lang: "zh-CN",
        start_url: "/",
        background_color: "#f7f0eb",
        theme_color: "#438579",
        theme_color_in_head: false,
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
                        childImageSharp {
                          gatsbyImageData
                        }
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
                  url: getCanonicalUrl(
                    site.siteMetadata.siteUrl,
                    getPostPath(node.fields.slug),
                  ),
                  guid: node.fields.slug,
                  custom_elements: [
                    {
                      "content:encoded": {
                        _cdata: node.body,
                      },
                    },
                    {
                      "atom:updated": new Date(
                        String(node.frontmatter.updated),
                      ).toUTCString(),
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
        apiKey:
          process.env.ALGOLIA_API_KEY ||
          (process.env.DRY_RUN === "true" ? "dry_run_dummy_key" : undefined),
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
                        childImageSharp {
                          gatsbyImageData
                        }
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
        dryRun: process.env.DRY_RUN === "true",
        continueOnFailure: process.env.DRY_RUN === "true",
        algoliasearchOptions: { timeouts: { connect: 1, read: 30, write: 30 } },
      },
    },
  ],
};

export default config;
