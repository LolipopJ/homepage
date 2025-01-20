import { graphql, PageProps, useStaticQuery } from "gatsby";
import * as React from "react";

import { NAVBAR_ITEMS } from "../constants/navbar";
import { BlogFrontmatter } from "../interfaces/blog";
import Navbar from "./navbar";

const Layout = (props: PageProps) => {
  const { children, path = "" } = props;
  const [subNavbarActiveKey, setSubNavbarActiveKey] =
    React.useState<string>("Posts");

  const data = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
        }
      }
      allMdx(
        sort: { frontmatter: { date: DESC } }
        filter: { internal: { contentFilePath: { regex: "/blog/posts/" } } }
      ) {
        nodes {
          frontmatter {
            date
            title
            tags
            categories
          }
        }
      }
    }
  `);
  const siteMetadata = data.site.siteMetadata;
  const postsData = (
    data.allMdx.nodes.map(
      // @ts-expect-error: ignored
      (node) => node.frontmatter,
    ) as Pick<BlogFrontmatter, "categories" | "date" | "tags" | "title">[]
  ).filter((node) => !!node.title);

  const selectedRouteKey = React.useMemo(() => {
    const pathSplits = path.split("/");
    if (pathSplits.length === 1) {
      return "/";
    } else {
      return `/${pathSplits[1]}`;
    }
  }, [path]);

  const showPosts = /^(\/about|\/posts|\/categories|\/tags|\/authors)/.test(
    path,
  );
  const showToc = /^(\/about|\/posts)/.test(path);
  const subNavbarKeys = [
    ...(showPosts ? ["Posts"] : []),
    ...(showToc ? ["Toc"] : []),
  ];

  return (
    <div className="flex h-screen overflow-y-hidden">
      {/* 左侧导航栏 */}
      <aside className="w-64 shrink-0 overflow-y-auto border-r border-neutral-600/80 bg-neutral-800/20 px-4">
        <div className="flex h-16 items-center px-3">
          <div className="font-bold">{siteMetadata.title}</div>
        </div>
        <Navbar items={NAVBAR_ITEMS} activeKey={selectedRouteKey} />
      </aside>
      {/* 左侧二级导航栏 */}
      <div
        className={`w-80 shrink-0 border-r border-neutral-600/80 bg-neutral-800/20 ${subNavbarKeys.length ? "block" : "hidden"}`}
      >
        <div className="flex h-16 items-center px-7">
          <ul className="flex gap-1 rounded-full border border-neutral-600/80 bg-neutral-800 p-0.5">
            {subNavbarKeys.map((key) => (
              <li
                key={key}
                className={`cursor-pointer rounded-full px-3 py-0.5 font-medium transition ${key === subNavbarActiveKey ? "bg-neutral-100 text-neutral-900" : ""}`}
                onClick={() => {
                  setSubNavbarActiveKey(key);
                }}
              >
                {key}
              </li>
            ))}
          </ul>
        </div>
        <div className="h-[calc(100vh-4rem)] overflow-y-auto px-4">
          {subNavbarActiveKey === "Posts" && <ol></ol>}
        </div>
      </div>
      {/* 主体内容部分 */}
      <main className="relative grow overflow-auto">
        <header className="sticky top-0 flex h-16 items-center bg-neutral-900/80 backdrop-blur-sm"></header>
        <article className="mx-24 min-h-[calc(100vh-16rem)] pb-48 pt-8">
          {children}
        </article>
        <footer className="flex h-48 items-center border-t border-neutral-600/80 bg-neutral-800/60"></footer>
      </main>
    </div>
  );
};

export default Layout;
