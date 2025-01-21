import { graphql, PageProps, useStaticQuery } from "gatsby";
import * as React from "react";

import Post from "../components/post";
import { NAVBAR_ITEMS } from "../constants/navbar";
import { PostBase } from "../interfaces/post";
import { parseFilePathToPostPath } from "../utils/post";
import Navbar from "./navbar";
import SiderBar, { SiderBarProps } from "./sider-bar";

const Layout = (props: PageProps) => {
  const { children, path = "/" } = props;
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
          id
          frontmatter {
            categories
            date
            tags
            title
          }
          internal {
            contentFilePath
          }
        }
      }
    }
  `);
  const siteMetadata = data.site.siteMetadata;
  const postsData: PostBase[] = data.allMdx.nodes.map(
    // @ts-expect-error: ignored
    (node) => ({ ...node.frontmatter, ...node.internal, id: node.id }),
  );

  const showPosts = /^(\/about|\/posts|\/categories|\/tags|\/authors)/.test(
    path,
  );
  const showToc = /^(\/about|\/posts)/.test(path);
  const subNavbarItems: SiderBarProps["items"] = [
    ...(showPosts
      ? [
          {
            key: "Posts",
            body: (
              <ol
                className={`${subNavbarActiveKey === "Posts" ? "block" : "hidden"}`}
              >
                {postsData.map((post) => {
                  const postPath = parseFilePathToPostPath(
                    post.contentFilePath,
                  );
                  const isActive = new RegExp(`^/posts/${postPath}/?`).test(
                    path,
                  );

                  return (
                    <li key={post.id}>
                      <Post
                        post={post}
                        postPath={postPath}
                        className={`mb-2 ${isActive ? "item-selected" : ""}`}
                      />
                    </li>
                  );
                })}
              </ol>
            ),
          },
        ]
      : []),
    ...(showToc
      ? [
          {
            key: "Toc",
            body: <></>,
          },
        ]
      : []),
  ];

  React.useEffect(() => {
    if (showToc) setSubNavbarActiveKey("Toc");
    else setSubNavbarActiveKey("Posts");
  }, [showToc]);

  const navbarActiveKey = React.useMemo(() => {
    const pathSplits = path.split("/");
    if (pathSplits.length === 1) {
      return "/";
    } else {
      return `/${pathSplits[1]}`;
    }
  }, [path]);

  return (
    <div className="flex h-screen overflow-y-hidden">
      <SiderBar
        className="w-64 shrink-0 px-4"
        header={
          <div className="mx-3 flex h-16 items-center">
            <div className="font-bold">{siteMetadata.title}</div>
          </div>
        }
      >
        <Navbar items={NAVBAR_ITEMS} activeKey={navbarActiveKey} />
      </SiderBar>

      <SiderBar
        items={subNavbarItems}
        className={`w-80 shrink-0 ${subNavbarItems.length ? "block" : "hidden"}`}
        activeKey={subNavbarActiveKey}
        onActiveKeyChange={(key) => setSubNavbarActiveKey(key)}
        headerClassName="px-4 mx-3"
        bodyClassName="px-4"
      />

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
