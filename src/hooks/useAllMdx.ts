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
        filter: { fields: { isPublic: { eq: true } } }
      ) {
        nodes {
          excerpt(pruneLength: 200)
          fields {
            slug
            isPublic
            isDraft
          }
          frontmatter {
            banner {
              childImageSharp {
                gatsbyImageData
              }
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
