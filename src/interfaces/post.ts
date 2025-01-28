export interface Post {
  /** 博文内容 */
  body: string;
  /** 博文摘要 */
  excerpt: string;
  frontmatter: PostFrontmatter;
  id: string;
  internal: PostInternal;
}

export interface PostFrontmatter {
  categories: string[];
  date: string;
  tags: string[];
  /** 博文是否具有时效性 */
  timeliness?: boolean;
  title: string;
  updated?: string;
}

export interface PostInternal {
  contentDigest: string;
  contentFilePath: string;
}
