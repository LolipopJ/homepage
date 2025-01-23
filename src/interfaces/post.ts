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
