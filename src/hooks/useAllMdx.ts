import { graphql, useStaticQuery } from "gatsby";

export const useAllMdx = () => {
  const {
    allMdx: { nodes: posts },
  } = useStaticQuery<{
    allMdx: { nodes: Pick<MdxNode, "excerpt" | "fields" | "frontmatter">[] };
  }>(graphql`
    query {
      allMdx(
        sort: { frontmatter: { date: DESC } }
        filter: { internal: { contentFilePath: { regex: "//blog/posts//" } } }
      ) {
        nodes {
          excerpt(pruneLength: 200)
          fields {
            slug
            isDraft
          }
          frontmatter {
            banner {
              publicURL
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
    }
  `);

  return posts;
};

export default useAllMdx;
