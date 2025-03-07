import * as React from "react";

import useSiteMetadata from "../hooks/useSiteMetadata";

export interface SEOProps {
  title: string;
  children?: React.ReactElement;
}

const SEO: React.FC<SEOProps> = ({ title, children }) => {
  const { title: siteTitle, description } = useSiteMetadata();

  return (
    <>
      <title>
        {title} • {siteTitle}
      </title>
      <meta name="description" content={description} />
      {children}
    </>
  );
};

export default SEO;
