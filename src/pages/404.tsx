import { HeadFC, Link, PageProps } from "gatsby";
import * as React from "react";

import SEO from "../components/seo";

const NotFoundPage: React.FC<PageProps> = () => {
  return (
    <div className="p-8 text-center">
      <h1 className="mb-4 text-xl font-bold">🚧 施工中</h1>
      <p>Ooops，当前您正在浏览的页面仍在施工中，不期开放 🙇！</p>
      <div className="mt-8">
        <Link
          to="/"
          className="item-selectable rounded-lg border border-foreground-tertiary p-2"
        >
          回到主页
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;

export const Head: HeadFC = () => <SEO title="(ᗒᗣᗕ)՞ 404" />;
