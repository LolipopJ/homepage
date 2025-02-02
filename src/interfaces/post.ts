export interface Post {
  /** 博客内容 */
  body: string;
  /** 博客摘要 */
  excerpt: string;
  frontmatter: PostFrontmatter;
  id: string;
  internal: PostInternal;
}

export interface PostFrontmatter {
  categories: string[];
  date: string;
  tags: string[];
  /** 博客是否需要关注内容时效性 */
  timeliness?: boolean;
  title: string;
  updated?: string;
}

export interface PostInternal {
  contentDigest: string;
  contentFilePath: string;
}
