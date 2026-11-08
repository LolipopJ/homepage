import * as React from "react";

import useSiteMetadata from "../hooks/useSiteMetadata";

export interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  pathname?: string;
  type?: "website" | "article" | "profile";
  article?: boolean;
  children?: React.ReactNode;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  image,
  pathname,
  type,
  article = false,
  children,
}) => {
  const {
    title: siteTitle,
    description: defaultDescription,
    siteUrl,
  } = useSiteMetadata();

  const metaDescription = (description || defaultDescription || "")
    .replace(/\s+/g, " ")
    .trim();

  const baseUrl = (siteUrl || "").replace(/\/+$/, "");
  const defaultImage = `${baseUrl}/icons/favicon.png`;

  let metaImage = defaultImage;
  if (image) {
    if (image.startsWith("http://") || image.startsWith("https://")) {
      metaImage = image;
    } else {
      metaImage = `${baseUrl}${image.startsWith("/") ? "" : "/"}${image}`;
    }
  }

  const canonicalUrl = pathname
    ? `${baseUrl}${pathname.startsWith("/") ? "" : "/"}${pathname}`
    : undefined;

  const ogType = type ?? (article ? "article" : "website");

  return (
    <>
      <title>
        {title} • {siteTitle}
      </title>
      <meta name="description" content={metaDescription} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:locale" content="zh_CN" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content={siteTitle} />

      {/* Twitter Card */}
      <meta
        name="twitter:card"
        content={metaImage === defaultImage ? "summary" : "summary_large_image"}
      />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      <meta name="twitter:image:alt" content={title} />

      {children}
    </>
  );
};

export default SEO;
