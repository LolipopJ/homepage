import type { ImageDataLike } from "gatsby-plugin-image";

declare global {
  interface SiteMetadata {
    title: string;
    owner: string;
    description: string;
    siteUrl: string;
    [key: string]: unknown;
  }

  interface MdxNode {
    body: string;
    excerpt: string;
    fields: {
      slug: string;
      isDraft: boolean;
    };
    frontmatter: {
      banner?: ImageDataLike;
      categories?: string[];
      tags?: string[];
      title?: string;
      date?: string;
      updated?: string;
      timeliness?: boolean;
    };
    id: string;
    internal: {
      contentDigest: string;
      contentFilePath: string;
    };
  }
}

export {};
