import { HeadFC, PageProps } from "gatsby";
import * as React from "react";

import SEO from "../components/seo";

const IndexPage: React.FC<PageProps> = () => {
  return <div>主页</div>;
};

export default IndexPage;

export const Head: HeadFC = () => <SEO title="主页" />;
