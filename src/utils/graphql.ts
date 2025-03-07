export const getAllMdxQueryString = ({
  sortByDate,
  includePosts,
  includeDrafts,
  includeAbout,
  excerpt,
}: {
  sortByDate?: "DESC" | "ASC";
  includePosts?: boolean;
  includeDrafts?: boolean;
  includeAbout?: boolean;
  excerpt?: number;
}) => {
  return `allMdx(
  ${sortByDate ? `sort: { frontmatter: { date: ${sortByDate} } }` : ""}
  filter: {
    internal: {
      contentFilePath: { regex: "/${[includePosts ? "/blog/posts/" : undefined, includeDrafts ? "/blog/drafts/" : undefined, includeAbout ? "/blog/about.mdx" : undefined].filter((path) => !!path).join("|")}/" }
    }
  }
) {
  nodes {
    ${excerpt ? `excerpt(pruneLength: ${excerpt})` : ""}
    frontmatter {
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
      contentFilePath
    }
  }
}`;
};
