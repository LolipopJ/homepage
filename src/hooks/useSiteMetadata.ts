import { graphql, useStaticQuery } from "gatsby";

export const useSiteMetadata = () => {
  const {
    site: { siteMetadata },
  } = useStaticQuery(graphql`
    query SiteMetaData {
      site {
        siteMetadata {
          title
          description
          owner
        }
      }
    }
  `);

  return siteMetadata as SiteMetadata;
};

export default useSiteMetadata;
