export interface Post extends PostBase {
  body: string;
}

export interface PostWithExcerpt extends PostBase {
  excerpt: string;
}

export interface PostBase extends PostFrontmatter, PostInternal {
  id: string;
}

export interface PostFrontmatter {
  categories: string[];
  date: string;
  tags: string[];
  timeliness?: boolean;
  title: string;
  updated?: string;
}

export interface PostInternal {
  contentFilePath: string;
}
