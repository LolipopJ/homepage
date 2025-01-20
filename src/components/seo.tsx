import { graphql, useStaticQuery } from "gatsby";
import * as React from "react";

export interface SEOProps {
  title: string;
  children?: React.ReactElement;
}

const SEO = ({ title, children }: SEOProps) => {
  const siteMetadata = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
          description
        }
      }
    }
  `).site.siteMetadata;

  return (
    <>
      <title>
        {title} · {siteMetadata.title}
      </title>
      <meta name="description" content={siteMetadata.description} />
      {children}
    </>
  );
};

export default SEO;
