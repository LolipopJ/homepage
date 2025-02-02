import { Fancybox } from "@fancyapps/ui";
import { faFolderOpen } from "@fortawesome/free-regular-svg-icons";
import {
  faBlog,
  faFolder,
  faHeart,
  faLaptopCode,
  faPenNib,
  faPersonRays,
  faSearch,
  faTag,
  faTags,
  faWarning,
} from "@fortawesome/free-solid-svg-icons";
import { graphql, PageProps, useStaticQuery } from "gatsby";
import { throttle } from "lodash-es";
import * as React from "react";

import AlgoliaSearch from "../components/algolia-search";
import Icon from "../components/icon";
import Post, { PostProps } from "../components/post";
import { NAVBAR_ITEMS } from "../constants/navbar";
import { parseFilePathToPostSlug } from "../utils/post";
import Navbar from "./navbar";
import SiderBar from "./sider-bar";

const Layout: React.FC<PageProps> = (props) => {
  const { children, path = "/", location } = props;
  const { hash } = location;

  const [subNavbarActiveKey, setSubNavbarActiveKey] =
    React.useState<string>("博客列表");
  const [pageTitle, setPageTitle] = React.useState<React.ReactNode>("");
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

  const {
    site: {
      siteMetadata: { title: siteTitle },
    },
    allMdx: { nodes },
  } = useStaticQuery(graphql`
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
  const posts: PostProps["post"][] = React.useMemo(
    () =>
      // @ts-expect-error: ignored
      nodes.map((node) => ({
        ...node,
        slug: parseFilePathToPostSlug(node.internal.contentFilePath),
      })),
    [nodes],
  );

  /** 是否显示博客列表 */
  const showPostsList = /^(\/posts|\/categories|\/tags|\/authors)/.test(path);
  /** 是否为博客页 */
  const isPostPage = /^(\/about|\/posts)/.test(path);
  const subNavbarActiveKeys = [
    ...(showPostsList ? ["博客列表"] : []),
    ...(isPostPage ? ["目录"] : []),
  ];

  React.useEffect(() => {
    setPageTitle("");
    mainRef.current?.scrollTo({ top: 0, behavior: "instant" });

    if (isPostPage) {
      setSubNavbarActiveKey("目录");
    } else {
      setSubNavbarActiveKey("博客列表");
    }
  }, [path, isPostPage]);

  //#region 初始化博客页面的图片预览功能
  React.useEffect(() => {
    if (isPostPage) {
      Fancybox.bind("[data-fancybox]");
      return () => Fancybox.unbind("[data-fancybox]");
    }
  }, [path, isPostPage]);
  //#endregion

  //#region 更新博客中 Headings 距离顶端的距离，适配图片加载完成等导致距离变化的情况
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

  //#region 监听博客滚动，更新目录列表与阅读进度
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

  //#region 更新页面标题
  React.useEffect(() => {
    const pageDom = pageRef.current;
    let match: RegExpMatchArray | null = null;

    if (path === "/") {
      setPageTitle(
        <>
          <Icon icon={faPenNib} className="p-2" />
          <span>所有博客</span>
        </>,
      );
    } else if (/^\/posts\/(.+?)\/?/.test(path)) {
      if (pageDom) {
        const postTitle = pageDom.querySelector("h1");

        if (postTitle) {
          // 监听博客页面滚动，更新页面标题为博客标题
          const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
              setPageTitle(
                <>
                  <Icon icon={faBlog} className="p-2" />
                  <span>博客</span>
                </>,
              );
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
    } else if (/^\/works\/?$/.test(path)) {
      setPageTitle(
        <>
          <Icon icon={faLaptopCode} className="p-2" />
          <span>作品集</span>
        </>,
      );
    } else if (/^\/about\/?$/.test(path)) {
      setPageTitle(
        <>
          <Icon icon={faPersonRays} className="p-2" />
          <span>关于我</span>
        </>,
      );
    } else if (/^\/friends\/?$/.test(path)) {
      setPageTitle(
        <>
          <Icon icon={faHeart} className="p-2" />
          <span>朋友们</span>
        </>,
      );
    } else if (/^\/tags\/?$/.test(path)) {
      setPageTitle(
        <>
          <Icon icon={faTags} className="p-2" />
          <span>所有标签</span>
        </>,
      );
    } else if ((match = path.match(/^\/tags\/(.+?)\/?$/))) {
      setPageTitle(
        <>
          <Icon icon={faTag} className="p-2" />
          <span>{decodeURIComponent(match[1])}</span>
        </>,
      );
    } else if (/^\/categories\/?$/.test(path)) {
      setPageTitle(
        <>
          <Icon icon={faFolder} className="p-2" />
          <span>所有分类</span>
        </>,
      );
    } else if ((match = path.match(/^\/categories\/(.+?)\/?$/))) {
      setPageTitle(
        <>
          <Icon icon={faFolderOpen} className="p-2" />
          <span>{decodeURIComponent(match[1])}</span>
        </>,
      );
    } else if (/^\/404\/?$/.test(path)) {
      setPageTitle(
        <>
          <Icon icon={faWarning} className="p-2" />
          <span>未开放区域</span>
        </>,
      );
    }
  }, [path]);
  //#endregion

  return (
    <div className="flex h-screen overflow-y-hidden">
      <SiderBar
        className="w-80 px-4"
        header={
          <div className="mx-3 flex h-16 items-center">
            <div className="text-lg font-bold">{siteTitle}</div>
          </div>
        }
      >
        <Navbar items={NAVBAR_ITEMS} activeKey={path} />
      </SiderBar>

      <SiderBar
        activeKey={subNavbarActiveKey}
        activeKeys={subNavbarActiveKeys}
        onActiveKeyChange={setSubNavbarActiveKey}
        headerClassName="px-4 mx-3"
        bodyClassName="px-4"
        className={`w-96`}
      >
        <ol
          className={`${subNavbarActiveKey === "博客列表" ? "block" : "hidden"}`}
        >
          {posts.map((post) => {
            const isActive = new RegExp(`^/posts/${post.slug}`).test(path);

            return (
              <li key={post.id}>
                <Post
                  post={post}
                  className={`mb-2 ${isActive ? "item-selected" : ""}`}
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
          <div className="line-clamp-1 flex flex-1 items-center text-lg font-bold">
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
        <div
          ref={pageRef}
          className="relative min-h-[calc(100vh-16rem)] px-24 py-12"
        >
          {children}
        </div>
        <footer className="flex h-48 items-center border-t border-foreground-tertiary bg-background-lighter"></footer>
      </main>

      {/* Algolia Search Dialog */}
      <div
        onClick={() => setOpenAlgoliaSearch(false)}
        className={`absolute inset-0 z-50 bg-neutral-900/60 backdrop-blur-sm ${openAlgoliaSearch ? "block" : "hidden"}`}
      >
        <AlgoliaSearch
          onClose={() => setOpenAlgoliaSearch(false)}
          className="mx-auto mt-16 max-h-[calc(100vh-4rem)] border border-foreground-tertiary bg-neutral-900/90"
        />
      </div>
    </div>
  );
};

export default Layout;
