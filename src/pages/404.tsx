import { HeadFC, Link, PageProps } from "gatsby";
import * as React from "react";

import SEO from "../components/seo";

const NotFoundPage: React.FC<PageProps> = () => {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">不存在的页面</h1>
      <p className="mb-8">Ooops 😔，当前您正在浏览的页面如今并不存在</p>
      <Link
        to="/"
        className="item-selectable rounded-lg border border-neutral-600/80 p-2"
      >
        回到主页
      </Link>
    </div>
  );
};

export default NotFoundPage;

export const Head: HeadFC = () => <SEO title="(ᗒᗣᗕ)՞ 404" />;
