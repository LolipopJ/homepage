import { Fancybox } from "@fancyapps/ui";
import { faFolderOpen } from "@fortawesome/free-regular-svg-icons";
import {
  faBlog,
  faChevronUp,
  faFolder,
  faHeart,
  faLaptopCode,
  faPenNib,
  faPersonRays,
  faRainbow,
  faSearch,
  faTag,
  faTags,
  faWarning,
} from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";
import { graphql, PageProps, useStaticQuery } from "gatsby";
import { throttle } from "lodash-es";
import * as React from "react";

import AlgoliaSearch from "../components/algolia-search";
import Icon from "../components/icon";
import Post, { PostProps } from "../components/post";
import { MIIT_BEIAN_LABEL, MPS_BEIAN_CODE } from "../constants/beian";
import { NAVBAR_ITEMS, SOCIAL_ITEMS } from "../constants/navbar";
import { parseFilePathToPostSlug } from "../utils/post";
import Navbar from "./navbar";
import SiderBar from "./sider-bar";

type SubNavbarActiveKey = "nav" | "posts" | "toc";

const Layout: React.FC<PageProps> = (props) => {
  const { children, path = "/", location } = props;
  const { hash } = location;

  const [subNavbarActiveKey, setSubNavbarActiveKey] =
    React.useState<SubNavbarActiveKey>();
  const [pageTitle, setPageTitle] = React.useState<React.ReactNode>("");
  const [openAlgoliaSearch, setOpenAlgoliaSearch] =
    React.useState<boolean>(false);
  const [pageHeadings, setPageHeadings] = React.useState<HTMLHeadingElement[]>(
    [],
  );
  const [currentHeading, setCurrentHeading] = React.useState<number>(-1);
  const [showBackTop, setShowBackTop] = React.useState<boolean>(false);
  const [readProgress, setReadProgress] = React.useState<number>(0); // %

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

  React.useEffect(() => {
    setPageTitle("");
    mainRef.current?.scrollTo({ top: 0, behavior: "instant" });

    if (isPostPage) {
      setSubNavbarActiveKey("toc");
    } else {
      setSubNavbarActiveKey("posts");
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
            tocRefs.current[index]?.scrollIntoView();
            break;
          }
          if (index === 0) {
            setCurrentHeading(-1);
            tocRefs.current[0]?.scrollIntoView();
          }
        }

        const progress = Math.ceil(
          ((scrollTop + mainDom.clientHeight) / pageHeight) * 100,
        );
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
    } else if (isPostPage) {
      if (pageDom) {
        const postTitle = pageDom.querySelector("h1");
        if (postTitle) {
          // 监听博客页面滚动，更新页面标题为博客标题
          const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
              setPageTitle(
                /^\/about\/?$/.test(path) ? (
                  <>
                    <Icon icon={faPersonRays} className="p-2" />
                    <span>关于我</span>
                  </>
                ) : (
                  <>
                    <Icon icon={faBlog} className="p-2" />
                    <span>博客</span>
                  </>
                ),
              );
              setShowBackTop(false);
            } else {
              setPageTitle(postTitle.innerText);
              setShowBackTop(true);
            }
          });

          observer.observe(postTitle);
          return () => {
            observer.unobserve(postTitle);
          };
        } else {
          setShowBackTop(true);
        }
      }
    } else if (/^\/works\/?$/.test(path)) {
      setPageTitle(
        <>
          <Icon icon={faLaptopCode} className="p-2" />
          <span>作品集</span>
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
  }, [isPostPage, path]);
  //#endregion

  return (
    <div className="flex h-screen overflow-y-hidden">
      <SiderBar
        className="w-72"
        bodyClassName="px-4"
        header={
          <div className="mx-3 flex h-header items-center px-4">
            <div className="text-lg font-bold">{siteTitle}</div>
          </div>
        }
      >
        <Navbar items={NAVBAR_ITEMS} activeKey={path} />
      </SiderBar>

      <SiderBar<SubNavbarActiveKey>
        items={[
          ...(showPostsList
            ? [
                {
                  key: "posts" as SubNavbarActiveKey,
                  label: "博客列表",
                  children: (
                    <ol>
                      {posts.map((post) => {
                        const isActive = new RegExp(
                          `^/posts/${post.slug}`,
                        ).test(path);

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
                  ),
                },
              ]
            : []),
          ...(isPostPage
            ? [
                {
                  key: "toc" as SubNavbarActiveKey,
                  label: "目录",
                  children: (
                    <ol className={`px-3`}>
                      {pageHeadings.map((heading, index) => {
                        const marginLeft = `${(Number(heading.nodeName[1]) - 2) * 1}rem`;

                        return (
                          <li
                            key={heading.innerText}
                            ref={(el) =>
                              (tocRefs.current[index] = el as HTMLLIElement)
                            }
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
                  ),
                },
              ]
            : []),
        ]}
        activeKey={subNavbarActiveKey}
        onActiveKeyChange={setSubNavbarActiveKey}
        headerClassName="px-4 mx-3"
        bodyClassName="px-4"
        className="w-88"
      />

      <main ref={mainRef} className="flex-1 overflow-auto">
        <header className="sticky top-0 z-20 flex h-header items-center bg-neutral-900/80 px-8 backdrop-blur-sm">
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
          className="relative min-h-[calc(100vh-var(--height-header)-var(--height-footer))] px-24 py-12"
        >
          {children}

          {/* Actions bar in post page */}
          {isPostPage && (
            <div className="sticky bottom-8 ml-auto flex w-0 flex-col gap-4 text-sm">
              <div
                className={`relative flex size-9 items-center justify-center rounded-full transition ${showBackTop ? "opacity-100" : "pointer-events-none opacity-0"}`}
                style={{
                  background: `conic-gradient(var(--foreground) ${readProgress * 3.6}deg, var(--foreground-tertiary) ${readProgress * 3.6}deg)`,
                }}
              >
                <div
                  className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-background transition hover:bg-foreground hover:text-background"
                  onClick={() =>
                    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" })
                  }
                >
                  <Icon icon={faChevronUp} />
                </div>
              </div>
            </div>
          )}
        </div>
        <footer className="flex h-footer flex-col justify-center gap-2 border-t border-foreground-tertiary bg-background-lighter px-16">
          <div className="flex items-center gap-2">
            <span>
              Powered by{" "}
              <a
                href="https://www.gatsbyjs.com/"
                target="_blank"
                rel="noreferrer"
                className="item-link"
              >
                Gatsby
              </a>
            </span>
            <Icon icon={faRainbow} />
            <span>
              Inspired by{" "}
              <a
                href="https://thesis.priority.vision/"
                target="_blank"
                rel="noreferrer"
                className="item-link"
              >
                Thesis
              </a>
            </span>
          </div>
          {(MIIT_BEIAN_LABEL || MPS_BEIAN_CODE) && (
            <div className="flex items-center gap-2">
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noreferrer"
              >
                {MIIT_BEIAN_LABEL}
              </a>
              <img
                src="/images/beian.png"
                alt="beian-icon"
                className="size-5"
              />
              <a
                href={`http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=${MPS_BEIAN_CODE}`}
                target="_blank"
                rel="noreferrer"
              >
                京公网安备 {MPS_BEIAN_CODE}号
              </a>
            </div>
          )}
          <div className="my-3 w-full border border-foreground-tertiary" />
          <div className="flex h-6 items-center justify-between">
            <span className="text-foreground-secondary">
              © {dayjs().year()}{" "}
              <a
                href="https://github.com/LolipopJ"
                target="_blank"
                rel="noreferrer"
              >
                Lolipop
              </a>
            </span>
            <div className="flex gap-2 text-xl">
              {SOCIAL_ITEMS.map((item) => (
                <a
                  key={item.url}
                  title={item.label}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="leading-none"
                >
                  <Icon
                    icon={item.icon}
                    className="item-selectable rounded-md p-2"
                  />
                </a>
              ))}
            </div>
          </div>
        </footer>
      </main>

      {/* Algolia Search Dialog */}
      <div
        onClick={() => setOpenAlgoliaSearch(false)}
        className={`absolute inset-0 z-50 bg-neutral-900/60 backdrop-blur-sm ${openAlgoliaSearch ? "block" : "hidden"}`}
      >
        <AlgoliaSearch
          onClose={() => setOpenAlgoliaSearch(false)}
          className="max-h-[calc(100vh-4rem)]] mx-auto mt-16 border border-foreground-tertiary bg-neutral-900/90"
        />
      </div>
    </div>
  );
};

export default Layout;
