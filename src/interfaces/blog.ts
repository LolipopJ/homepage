export interface BlogFrontmatter {
  categories: string[];
  date: string;
  tags: string[];
  timeliness?: boolean;
  title: string;
  updated?: string;
}
