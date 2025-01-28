import { Fancybox } from "@fancyapps/ui";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { graphql, PageProps, useStaticQuery } from "gatsby";
import { throttle } from "lodash-es";
import * as React from "react";

import AlgoliaSearch from "../components/algolia-search";
import Icon from "../components/icon";
import Post, { PostProps } from "../components/post";
import { NAVBAR_ITEMS } from "../constants/navbar";
import GlobalContext, { GlobalContextValues } from "../contexts/global";
import { parseFilePathToPostSlug } from "../utils/post";
import Navbar from "./navbar";
import SiderBar from "./sider-bar";

const Layout = (props: PageProps) => {
  const { children, path = "/", location } = props;
  const { hash } = location;

  const [subNavbarActiveKey, setSubNavbarActiveKey] =
    React.useState<string>("博文列表");
  const [pageTitle, setPageTitle] = React.useState<string>("");
  const [openAlgoliaSearch, setOpenAlgoliaSearch] =
    React.useState<boolean>(false);
  const [pageHeadings, setPageHeadings] = React.useState<HTMLHeadingElement[]>(
    [],
  );
  const [currentHeading, setCurrentHeading] = React.useState<number>(-1);
  const [readProgress, setReadProgress] = React.useState<number>(0);

  const hashRef = React.useRef<string>("");
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
          frontmatter {
            categories
            tags
            title
            date
            updated
            timeliness
          }
          id
          internal {
            contentFilePath
          }
        }
      }
    }
  `);
  const siteMetadata = data.site.siteMetadata;
  const postsData: PostProps["post"][] = React.useMemo(
    () =>
      // @ts-expect-error: ignored
      data.allMdx.nodes.map((node) => ({
        ...node,
        slug: parseFilePathToPostSlug(node.internal.contentFilePath),
      })),
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

  /** 是否显示博文列表 */
  const showPostsList = /^(\/posts|\/categories|\/tags|\/authors)/.test(path);
  /** 是否为博文页 */
  const isPostPage = /^(\/about|\/posts)/.test(path);

  React.useEffect(() => {
    setPageTitle("");
    mainRef.current?.scrollTo({ top: 0, behavior: "instant" });

    if (isPostPage) {
      setSubNavbarActiveKey("目录");
    } else {
      setSubNavbarActiveKey("博文列表");
    }
  }, [path, isPostPage]);

  //#region 初始化博文页面的图片预览功能
  React.useEffect(() => {
    if (isPostPage) {
      Fancybox.bind("[data-fancybox]");
      return () => Fancybox.unbind("[data-fancybox]");
    }
  }, [path, isPostPage]);
  //#endregion

  //#region 更新博文中 Headings 距离顶端的距离，适配图片加载完成等导致距离变化的情况
  React.useEffect(() => {
    const pageDom = pageRef.current;
    if (isPostPage && pageDom) {
      const observer = new ResizeObserver(() => {
        const headings: HTMLHeadingElement[] = Array.from(
          pageDom.querySelectorAll("h1, h2, h3, h4, h5, h6"),
        );
        headings.forEach((heading) => {
          heading.id = encodeURIComponent(heading.innerText);
        });
        if (headings.length) {
          setPageHeadings(
            headings.filter((heading) => heading.nodeName !== "H1"),
          );
        } else {
          setPageHeadings([]);
        }
      });

      observer.observe(pageDom);
      return () => observer.unobserve(pageDom);
    } else {
      setPageHeadings([]);
    }
  }, [path, isPostPage]);
  //#endregion

  //#region 处理 Hash 查询，跳转到指定 Heading
  React.useEffect(() => {
    if (hash && hashRef.current !== hash) {
      const targetId = hash.slice(1);
      const pageHeading = pageHeadings.find(
        (heading) => heading.id === targetId,
      );

      if (pageHeading) {
        pageHeading.scrollIntoView();
        hashRef.current = hash;
      }
    }
  }, [hash, pageHeadings]);
  //#endregion

  //#region 监听博文滚动，更新目录列表与阅读进度
  React.useEffect(() => {
    const mainDom = mainRef.current;
    const pageDom = pageRef.current;
    if (isPostPage && pageHeadings && mainDom && pageDom) {
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
  }, [path, isPostPage, pageHeadings]);
  //#endregion

  //#region 监听博文滚动，更新博客页面标题
  React.useEffect(() => {
    const pageDom = pageRef.current;
    if (isPostPage && pageDom) {
      const postTitle = pageDom.querySelector("h1");

      if (postTitle) {
        const observer = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) {
            setPageTitle("");
          } else {
            setPageTitle(postTitle.innerText);
          }
        });

        observer.observe(postTitle);
        return () => {
          observer.unobserve(postTitle);
        };
      }
    }
  }, [path, isPostPage]);
  //#endregion

  return (
    <div className="flex h-screen overflow-y-hidden">
      <SiderBar
        className="w-80 px-4"
        header={
          <div className="mx-3 flex h-16 items-center">
            <div className="text-lg font-bold">{siteMetadata.title}</div>
          </div>
        }
      >
        <Navbar items={NAVBAR_ITEMS} activeKey={navbarActiveKey} />
      </SiderBar>

      <SiderBar
        activeKey={subNavbarActiveKey}
        activeKeys={[
          ...(showPostsList ? ["博文列表"] : []),
          ...(isPostPage ? ["目录"] : []),
        ]}
        onActiveKeyChange={setSubNavbarActiveKey}
        headerClassName="px-4 mx-3"
        bodyClassName="px-4"
        className={`w-96`}
      >
        <ol
          className={`${subNavbarActiveKey === "博文列表" ? "block" : "hidden"}`}
        >
          {postsData.map((post) => {
            const isActive = new RegExp(`^/posts/${post.slug}`).test(path);

            return (
              <li key={post.id}>
                <Post
                  post={post}
                  className={`item-selectable mb-2 ${isActive ? "item-selected" : ""}`}
                />
              </li>
            );
          })}
        </ol>
        <ol
          className={`px-3 ${subNavbarActiveKey === "目录" ? "block" : "hidden"}`}
        >
          {pageHeadings.map((heading, index) => {
            const marginLeft = `${(Number(heading.nodeName[1]) - 2) * 1}rem`;

            return (
              <li
                key={heading.innerText}
                ref={(el) => (tocRefs.current[index] = el as HTMLLIElement)}
                style={{ marginLeft }}
                className={`item-selectable mb-1 rounded-lg ${currentHeading > index ? "text-foreground-secondary" : currentHeading === index ? "item-selected" : ""}`}
              >
                <a
                  href={`#${heading.id}`}
                  className="block px-3 py-2 transition"
                >
                  <span
                    dangerouslySetInnerHTML={{
                      __html: heading.innerHTML,
                    }}
                    className="pointer-events-none"
                  />
                </a>
              </li>
            );
          })}
        </ol>
      </SiderBar>

      <main ref={mainRef} className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex h-16 items-center bg-neutral-900/80 px-8 backdrop-blur-sm">
          <div
            title={pageTitle}
            className="line-clamp-1 flex-1 text-lg font-bold"
          >
            {pageTitle}
          </div>
          <div className="ml-auto justify-end pl-16">
            <Icon
              icon={faSearch}
              className="item-selectable rounded-md p-2"
              onClick={() => setOpenAlgoliaSearch(true)}
            />
          </div>
        </header>
        <div ref={pageRef} className="relative min-h-[calc(100vh-16rem)]">
          <GlobalContext.Provider value={globalContextValues}>
            {children}
          </GlobalContext.Provider>
        </div>
        <footer className="flex h-48 items-center border-t border-foreground-tertiary bg-neutral-800/60"></footer>
      </main>

      {/* Algolia Search Dialog */}
      {openAlgoliaSearch && (
        <div
          onClick={() => setOpenAlgoliaSearch(false)}
          className={`absolute inset-0 z-50 bg-neutral-900/60 backdrop-blur-sm`}
        >
          <AlgoliaSearch
            onClose={() => setOpenAlgoliaSearch(false)}
            className="mx-auto mt-16 max-h-[calc(100vh-4rem)] border border-foreground-tertiary bg-neutral-900/90"
          />
        </div>
      )}
    </div>
  );
};

export default Layout;
