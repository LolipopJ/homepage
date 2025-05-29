import { faFolderOpen } from "@fortawesome/free-regular-svg-icons";
import {
  faBlog,
  faChevronUp,
  faClose,
  faCookie,
  faCookieBite,
  faFolder,
  faHeart,
  faLaptopCode,
  faNavicon,
  faPenNib,
  faPersonRays,
  faRainbow,
  faSearch,
  faTag,
  faTags,
  faWarning,
} from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";
import { Link, PageProps } from "gatsby";
import { throttle } from "lodash-es";
import * as React from "react";

import ActionButton from "../components/action-button";
import AlgoliaSearch from "../components/algolia-search";
import GitalkComponent from "../components/gitalk";
import Icon from "../components/icon";
import Post from "../components/post";
import { MIIT_BEIAN_LABEL, MPS_BEIAN_CODE } from "../constants/beian";
import { FOOTER_SOCIAL_ITEMS, NAVBAR_ITEMS } from "../constants/navbar";
import useAllMdx from "../hooks/useAllMdx";
import useTailwindBreakpoint from "../hooks/useScreenBreakpoint";
import useSiteMetadata from "../hooks/useSiteMetadata";
import Navbar from "./navbar";
import SiderBar, { SiderBarProps } from "./sider-bar";

type SubNavbarActiveKey = "nav" | "posts" | "toc";

const Layout: React.FC<PageProps> = (props) => {
  const { children, path = "/", location } = props;
  const { hash, href } = location;

  const [subNavbarActiveKey, setSubNavbarActiveKey] =
    React.useState<SubNavbarActiveKey>();
  /** 小屏幕开启导航栏抽屉状态 */
  const [openSubNavbarDrawer, setOpenSubNavbarDrawer] =
    React.useState<boolean>(false);
  const [isImmersive, setIsImmersive] = React.useState<boolean>(false);
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

  const { title: siteTitle } = useSiteMetadata();
  const posts = useAllMdx();
  const [breakpoint, breakpointInitialized] = useTailwindBreakpoint();

  /** 当前路由是否为博客页 */
  const [isPostPage, postSlug] = React.useMemo(() => {
    if (/^\/about-me\//.test(path)) {
      return [true, "about-me"];
    }

    const result = path.match(/^\/posts\/(.+)\//);
    return [result !== null, result?.[1]];
  }, [path]);

  /** 是否激活了沉浸模式 */
  const isImmersiveActivated = React.useMemo(() => {
    return isImmersive && isPostPage && breakpoint["lg"];
  }, [breakpoint, isImmersive, isPostPage]);

  //#region 切换路由时初始化页面状态
  React.useEffect(() => {
    setPageTitle("");
    setOpenSubNavbarDrawer(false);
    mainRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [path]);
  //#endregion

  //#region 自动设置侧边栏激活的页面
  React.useEffect(() => {
    if (isPostPage) {
      // 访问博客页面时，侧边栏切换到目录页
      setSubNavbarActiveKey("toc");
    } else {
      if (breakpoint["2xl"]) {
        setSubNavbarActiveKey("posts");
      } else {
        setSubNavbarActiveKey("nav");
      }
    }
  }, [breakpoint, isPostPage]);

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
                postSlug === "about-me" ? (
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
              setPageTitle(
                <span className="line-clamp-1" title={postTitle.innerText}>
                  {postTitle.innerText}
                </span>,
              );
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
  }, [isPostPage, path, postSlug]);
  //#endregion

  const subNavbarItems: SiderBarProps<SubNavbarActiveKey>["items"] = [
    {
      key: "posts",
      label: "博客列表",
      children: (
        <ol>
          {posts.map((post) => {
            const isActive = new RegExp(`^/posts/${post.fields.slug}`).test(
              path,
            );

            return (
              <li key={post.fields.slug}>
                <Post
                  post={post}
                  className={`mb-2 ${isActive ? "item-selected" : ""}`}
                  excerptClassName="hidden"
                />
              </li>
            );
          })}
        </ol>
      ),
    },
  ];

  if (isPostPage) {
    subNavbarItems.push({
      key: "toc",
      label: "目录",
      children: (
        <ol className={`px-3`}>
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
      ),
    });
  }

  const siderBarItemNav = <Navbar items={NAVBAR_ITEMS} activeKey={path} />;
  if (!breakpoint["2xl"]) {
    subNavbarItems.unshift({
      key: "nav",
      label: "导航",
      children: siderBarItemNav,
    });
  }

  return (
    <div className="flex h-screen print:h-auto">
      {/* 初始化完成前的蒙版层 */}
      <div
        className={`absolute inset-0 z-50 bg-neutral-900 transition duration-500 ${breakpointInitialized ? "pointer-events-none bg-neutral-900/0" : ""}`}
      ></div>

      {/* 侧边栏 */}
      <SiderBar
        className={`hidden w-72 2xl:block print:hidden ${isImmersiveActivated ? "!hidden" : ""}`}
        header={
          <div className="mx-5 flex h-header items-center px-4">
            <Link to="/" className="text-lg font-bold">
              {siteTitle}
            </Link>
          </div>
        }
        bodyClassName="px-4"
      >
        {siderBarItemNav}
      </SiderBar>
      <SiderBar<SubNavbarActiveKey>
        items={subNavbarItems}
        activeKey={subNavbarActiveKey}
        onActiveKeyChange={setSubNavbarActiveKey}
        headerClassName="px-4 mx-3"
        bodyClassName="px-4"
        className={`print:hidden ${isImmersiveActivated ? "!hidden" : ""} ${
          breakpoint["lg"]
            ? `w-96 2xl:w-88`
            : `fixed top-[calc(var(--height-header))] z-20 h-[calc(100vh-var(--height-header))] w-full border-none transition sm:w-96 ${openSubNavbarDrawer ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-96 opacity-0"}`
        }`}
      />

      {/* 路由主体 */}
      <main
        ref={mainRef}
        className={`flex-1 ${openSubNavbarDrawer || openAlgoliaSearch ? "overflow-hidden" : "overflow-auto"}`}
      >
        <header
          className={`sticky top-0 z-20 flex h-header items-center bg-background-light px-8 backdrop-blur-sm lg:bg-neutral-900/80 print:hidden ${isImmersiveActivated ? "!hidden" : ""}`}
        >
          <div
            className={`item-selectable mr-4 flex size-8 items-center justify-center rounded-md border-2 border-foreground lg:hidden ${openSubNavbarDrawer ? "bg-foreground text-background hover:border-foreground-secondary hover:bg-foreground-secondary hover:text-background-darker" : ""}`}
            onClick={() => {
              setOpenSubNavbarDrawer((prev) => !prev);
            }}
          >
            <Icon
              icon={openSubNavbarDrawer ? faClose : faNavicon}
              className="size-4"
            />
          </div>
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
          className="relative min-h-[calc(100vh-var(--height-header)-var(--height-footer))] p-8 lg:px-16 lg:py-12 2xl:px-24"
        >
          {/* 站点信息（打印时显示） */}
          <div className="mb-12 hidden print:block">
            <div>Site: {siteTitle}</div>
            <div>Print Date: {dayjs().toISOString()}</div>
            <div>
              Link:{" "}
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="item-link"
              >
                {href}
              </a>
            </div>
          </div>

          {children}

          {/* 博客页的评论系统 */}
          {isPostPage && !!postSlug && (
            <GitalkComponent
              gitalkId={postSlug}
              className="gitalk mx-auto mt-24 max-w-xl print:hidden"
            />
          )}

          {/* 博客页的操作按钮 */}
          {isPostPage && (
            <div className="sticky bottom-8 z-10 mt-12 flex flex-col items-end justify-end gap-4 text-sm print:hidden">
              {/* 回到顶部按钮 */}
              <div
                className={`relative flex size-9 items-center justify-center rounded-full transition ${showBackTop ? "opacity-100" : "pointer-events-none opacity-0"}`}
                style={{
                  background: `conic-gradient(var(--foreground) ${readProgress * 3.6}deg, var(--foreground-tertiary) ${readProgress * 3.6}deg)`,
                }}
              >
                <ActionButton
                  icon={faChevronUp}
                  onClick={() =>
                    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" })
                  }
                />
              </div>
              {/* 沉浸式浏览按钮 */}
              <div className="hidden lg:block">
                <ActionButton
                  icon={isImmersive ? faCookieBite : faCookie}
                  onClick={() => setIsImmersive((prev) => !prev)}
                  className={`size-9 border-2 ${isImmersive ? "border-foreground" : "border-foreground-tertiary"}`}
                  title={isImmersive ? "退出沉浸模式" : "进入沉浸模式"}
                />
              </div>
            </div>
          )}
        </div>

        <footer
          className={`flex h-footer flex-col justify-center gap-2 border-t border-foreground-tertiary bg-background-lighter px-16 print:hidden ${isImmersiveActivated ? "!hidden" : ""}`}
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
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
            <Icon icon={faRainbow} className="hidden md:block" />
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
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
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
                className="hidden size-5 md:block"
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
            <div className="-mr-2 flex gap-2 text-xl">
              {FOOTER_SOCIAL_ITEMS.map((item) => (
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

        {/* 小屏幕：打开侧边栏抽屉时的蒙版层 */}
        <div
          className={`${openSubNavbarDrawer ? "block" : "hidden"} absolute inset-0 bg-neutral-900/80 backdrop-blur-sm lg:hidden print:hidden`}
          onClick={() => setOpenSubNavbarDrawer(false)}
        />
      </main>

      {/* Algolia 搜索窗口 */}
      <div
        onClick={() => setOpenAlgoliaSearch(false)}
        className={`absolute inset-0 z-30 bg-neutral-900/60 backdrop-blur-sm print:hidden ${openAlgoliaSearch ? "block" : "hidden"}`}
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
