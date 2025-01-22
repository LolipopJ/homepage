import { graphql, PageProps, useStaticQuery } from "gatsby";
import { throttle } from "lodash-es";
import * as React from "react";

import Post from "../components/post";
import { NAVBAR_ITEMS } from "../constants/navbar";
import GlobalContext, { GlobalContextValues } from "../contexts/global";
import { PostBase } from "../interfaces/post";
import { parseFilePathToPostPath } from "../utils/post";
import Navbar from "./navbar";
import SiderBar from "./sider-bar";

const Layout = (props: PageProps) => {
  const { children, path = "/" } = props;

  const [subNavbarActiveKey, setSubNavbarActiveKey] =
    React.useState<string>("Posts");
  const [pageTitle, setPageTitle] = React.useState<string>("");
  const [pageHeadings, setPageHeadings] = React.useState<HTMLHeadingElement[]>(
    [],
  );
  const [currentHeading, setCurrentHeading] = React.useState<number>(-1);
  const [readProgress, setReadProgress] = React.useState<number>(0);

  const mainRef = React.useRef<HTMLElement>(null);
  const pageRef = React.useRef<HTMLDivElement>(null);
  const tocRefs = React.useRef<HTMLLIElement[]>([]);

  const globalContextValues: GlobalContextValues = React.useMemo(
    () => ({
      setPageTitle: (title) => setPageTitle(title),
    }),
    [],
  );

  const data = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
        }
      }
      allMdx(
        sort: { frontmatter: { date: DESC } }
        filter: { internal: { contentFilePath: { regex: "//blog/posts//" } } }
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
  const postsData: PostBase[] = React.useMemo(
    () =>
      data.allMdx.nodes.map(
        // @ts-expect-error: ignored
        (node) => ({ ...node.frontmatter, ...node.internal, id: node.id }),
      ),
    [data],
  );

  const navbarActiveKey = React.useMemo(() => {
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
  const isPostPage = /^(\/about|\/posts)/.test(path);

  React.useEffect(() => {
    setPageTitle("");
    mainRef.current?.scrollTo({ top: 0, behavior: "instant" });

    if (isPostPage) {
      setSubNavbarActiveKey("Toc");
    } else {
      setSubNavbarActiveKey("Posts");
    }
  }, [path, isPostPage]);

  //#region 更新 Headings 距离顶端的距离，适配图片加载完成等导致距离变化的情况
  React.useEffect(() => {
    const pageDom = pageRef.current;
    if (isPostPage && pageDom) {
      const observer = new ResizeObserver(() => {
        const headings: HTMLHeadingElement[] = Array.from(
          pageDom.querySelectorAll("h2, h3, h4, h5, h6"),
        );
        if (headings.length) {
          setPageHeadings(headings);
        }
      });

      observer.observe(pageDom);
      return () => observer.unobserve(pageDom);
    } else {
      setPageHeadings([]);
    }
  }, [isPostPage]);
  //#endregion

  React.useEffect(() => {
    const mainDom = mainRef.current;
    const pageDom = pageRef.current;
    if (isPostPage && pageHeadings.length && mainDom && pageDom) {
      const onScrolled = () => {
        const pageHeight = pageDom.clientHeight;
        const scrollTop = mainDom.scrollTop;
        for (let index = pageHeadings.length - 1; index >= 0; index -= 1) {
          const { offsetTop } = pageHeadings[index];
          if (Math.ceil(scrollTop) >= offsetTop) {
            setCurrentHeading(index);
            tocRefs.current[index].scrollIntoView();
            break;
          }
          if (index === 0) {
            setCurrentHeading(-1);
            tocRefs.current[0].scrollIntoView();
          }
        }

        const progress =
          Math.min(
            Math.floor(((scrollTop + mainDom.clientHeight) / pageHeight) * 100),
            100,
          ) / 100;
        setReadProgress(progress);
      };
      onScrolled();

      const throttleOnScrolled = throttle(onScrolled, 50);
      mainDom.addEventListener("scroll", throttleOnScrolled);
      return () => mainDom.removeEventListener("scroll", throttleOnScrolled);
    } else {
      setCurrentHeading(-1);
      setReadProgress(0);
    }
  }, [pageHeadings, isPostPage]);

  return (
    <div className="flex h-screen overflow-y-hidden">
      <SiderBar
        className="w-64 shrink-0 px-4"
        header={
          <div className="mx-3 flex h-16 items-center">
            <div className="font-bold text-primary">{siteMetadata.title}</div>
          </div>
        }
      >
        <Navbar items={NAVBAR_ITEMS} activeKey={navbarActiveKey} />
      </SiderBar>

      <SiderBar
        activeKey={subNavbarActiveKey}
        activeKeys={[
          ...(showPosts ? ["Posts"] : []),
          ...(isPostPage ? ["Toc"] : []),
        ]}
        onActiveKeyChange={setSubNavbarActiveKey}
        headerClassName="px-4 mx-3"
        bodyClassName="px-4"
        className={`w-80 shrink-0`}
      >
        <ol
          className={`${subNavbarActiveKey === "Posts" ? "block" : "hidden"}`}
        >
          {postsData.map((post) => {
            const postPath = parseFilePathToPostPath(post.contentFilePath);
            const isActive = new RegExp(`^/posts/${postPath}/?`).test(path);

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
        <ol
          className={`px-3 ${subNavbarActiveKey === "Toc" ? "block" : "hidden"}`}
        >
          {pageHeadings.map((heading, index) => {
            const marginLeft = `${(Number(heading.nodeName[1]) - 2) * 1}rem`;

            return (
              <li
                key={heading.innerText}
                ref={(el) => (tocRefs.current[index] = el as HTMLLIElement)}
                style={{ marginLeft }}
                className={`item-selectable mb-1 rounded-lg ${currentHeading > index ? "text-neutral-100/60" : currentHeading === index ? "item-selected" : ""}`}
              >
                <a
                  href={`#${encodeURIComponent(heading.innerText.split(" ").join("-"))}`}
                  dangerouslySetInnerHTML={{
                    __html: heading.innerHTML,
                  }}
                  className="block px-3 py-2 transition"
                />
              </li>
            );
          })}
        </ol>
      </SiderBar>

      <main ref={mainRef} className="grow overflow-auto">
        <header className="sticky top-0 z-10 flex h-16 items-center bg-neutral-900/80 px-8 backdrop-blur-sm">
          <div title={pageTitle} className="line-clamp-1 flex-1">
            {pageTitle}
          </div>
          <div className="ml-auto pl-24"></div>
        </header>
        <div ref={pageRef} className="relative min-h-[calc(100vh-12rem)]">
          <GlobalContext.Provider value={globalContextValues}>
            {children}
          </GlobalContext.Provider>
        </div>
        <footer className="flex h-48 items-center border-t border-neutral-600/80 bg-neutral-800/60"></footer>
      </main>
    </div>
  );
};

export default Layout;
