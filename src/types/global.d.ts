declare global {
  interface SiteMetadata {
    title: string;
    description: string;
    siteUrl: string;
  }

  interface MdxNode {
    body: string;
    excerpt: string;
    fields: {
      slug: string;
    };
    frontmatter: {
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
