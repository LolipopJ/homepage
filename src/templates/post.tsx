import { Fancybox } from "@fancyapps/ui";
import { MDXProvider } from "@mdx-js/react";
import dayjs from "dayjs";
import { HeadProps, Link, PageProps } from "gatsby";
import { MDXProps } from "mdx/types";
import * as React from "react";

import Card from "../components/card";
import Category from "../components/category";
import SEO from "../components/seo";
import Tag from "../components/tag";
import { type Post } from "../hooks/useAllMdx";

const FancyBoxImage = (props: { alt?: string; src?: string }) => {
  const {
    alt = "The author is too lazy to give an alt",
    src,
    ...restProps
  } = props;
  return (
    <a href={src} data-fancybox="gallery" data-caption={alt}>
      <img src={src} alt={alt} {...restProps} />
    </a>
  );
};

const ALink = ({
  href = "",
  children,
}: {
  href?: string;
  children?: React.ReactNode;
}) => {
  const isExternalHref = !href?.startsWith("#");
  const parsedHref = isExternalHref
    ? href
    : `#${encodeURIComponent(href.slice(1))}`;

  return (
    <a
      href={parsedHref}
      target={isExternalHref ? "_blank" : undefined}
      rel="noreferrer"
    >
      {children}
    </a>
  );
};

const components: MDXProps["components"] = {
  a: ALink,
  img: FancyBoxImage,
  Card,
  Link,
};

type PostPageContext = Pick<Post, "frontmatter">;

const PostTemplate: React.FC<PageProps<object, PostPageContext>> = ({
  children,
  pageContext,
}) => {
  const {
    frontmatter: {
      title,
      date: dateString,
      updated: updatedDateString,
      categories,
      tags,
      timeliness = true,
    },
  } = pageContext;

  const articleRef = React.useRef<HTMLElement>(null);

  const date = dayjs(dateString);
  const updatedDate = updatedDateString ? dayjs(updatedDateString) : date;
  const today = dayjs();
  const diffDays = today.diff(updatedDate, "days");

  //#region 初始化博客页面的图片预览功能
  React.useEffect(() => {
    const optimizedImageLinks =
      articleRef.current?.querySelectorAll<HTMLLinkElement>(
        "a.gatsby-resp-image-link",
      );
    optimizedImageLinks?.forEach((link) => {
      const image = link.children.item(1) as HTMLImageElement;
      link.setAttribute("data-fancybox", "gallery");
      link.setAttribute("data-caption", image.alt);
    });

    Fancybox.bind("[data-fancybox]");
    return () => Fancybox.unbind("[data-fancybox]");
  }, []);
  //#endregion

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-y-12">
      <div className="flex flex-col gap-4">
        {categories?.length && (
          <Category name={categories[0]} className="item-selectable" />
        )}
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="item-secondary flex gap-2">
          {dateString && (
            <span
              title={`首次发布于：${date.toString()}\n最后更新于：${updatedDate.toString()}`}
            >
              {date.format("MM 月 DD 日 YYYY 年")}
            </span>
          )}
          {tags?.length && (
            <div className="flex flex-1 flex-wrap gap-2 before:content-['•']">
              {tags.map((tag) => (
                <Tag
                  key={tag}
                  name={tag}
                  className="item-secondary item-selectable"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <article ref={articleRef} className="heti post-entry">
        {timeliness && diffDays > 365 && (
          <blockquote className="border-l-4 border-orange-400">
            这是一篇<strong>最后更新于 {diffDays} 天前</strong>
            的博客，内容可能随着时间的推移而变得不再适用，建议您仔细评估信息的有效性。
          </blockquote>
        )}
        <MDXProvider components={components}>{children}</MDXProvider>
      </article>
    </div>
  );
};

export const Head = ({ pageContext }: HeadProps<object, PostPageContext>) => {
  return <SEO title={pageContext.frontmatter.title} />;
};

export default PostTemplate;
