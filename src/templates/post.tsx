import { MDXProvider } from "@mdx-js/react";
import dayjs from "dayjs";
import { HeadProps, Link, PageProps } from "gatsby";
import { MDXProps } from "mdx/types";
import * as React from "react";

import Card from "../components/card";
import Category from "../components/category";
import SEO from "../components/seo";
import Tag from "../components/tag";
import { PostFrontmatter } from "../interfaces/post";

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

interface PostPageContext {
  body: string;
  frontmatter: PostFrontmatter;
  id: string;
}

const PostTemplate: React.FC<PageProps<object, PostPageContext>> = ({
  children,
  pageContext,
}) => {
  const {
    title,
    date: dateString,
    updated: updatedDateString,
    categories,
    tags,
    timeliness,
  } = pageContext.frontmatter;

  const date = new Date(dateString);
  const updatedDate = updatedDateString ? new Date(updatedDateString) : date;

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-12 flex flex-col gap-4">
        {categories?.length && (
          <Category name={categories[0]} className="item-selectable" />
        )}
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="item-secondary flex gap-2">
          {dateString && (
            <span
              title={`首次发布于：${date.toString()}\n最后更新于：${updatedDate.toString()}`}
            >
              {dayjs(date).format("MM 月 DD 日 YYYY 年")}
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
      <article className="heti post-entry mb-12">
        <MDXProvider components={components}>{children}</MDXProvider>
      </article>
    </div>
  );
};

export const Head = ({ pageContext }: HeadProps<object, PostPageContext>) => {
  return <SEO title={pageContext.frontmatter.title} />;
};

export default PostTemplate;
