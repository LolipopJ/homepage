declare global {
  interface Window {
    /**
     * Gitalk is a modern comment component based on GitHub Issue and Preact.
     * @link https://github.com/gitalk/gitalk
     */
    Gitalk?: Gitalk.default.Constructor;
  }

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
