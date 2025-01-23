import { Fancybox } from "@fancyapps/ui";
import { MDXProvider } from "@mdx-js/react";
import dayjs from "dayjs";
import { HeadProps, Link, PageProps } from "gatsby";
import { MDXProps } from "mdx/types";
import * as React from "react";

import Category from "../components/category";
import SEO from "../components/seo";
import Tag from "../components/tag";
import GlobalContext from "../contexts/global";
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

/** 提取 props 包含 dangerouslySetInnerHTML.__html 的 Element 里的 innerText */
const extractHeadingText = (children: React.ReactNode[]) => {
  let text = "";

  React.Children.forEach(children, (child) => {
    if (typeof child === "string") {
      text += child;
    } else if (React.isValidElement(child)) {
      text +=
        String(child.props.dangerouslySetInnerHTML.__html).match(
          /<[^>]+>([^<]+)<\/[^>]+>/,
        )?.[1] ?? "";
    }
  });

  return text;
};
const Heading = ({
  children,
  level,
}: {
  children?: React.ReactNode;
  level: number;
}) => {
  const childrenList = Array.isArray(children) ? children : [children];
  return React.createElement(
    `h${level}`,
    {
      id: encodeURIComponent(
        extractHeadingText(childrenList).split(" ").join("-"),
      ),
    },
    children,
  ) as React.JSX.Element;
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
  h1: (props: { children?: React.ReactNode }) => (
    <Heading {...props} level={1} />
  ),
  h2: (props: { children?: React.ReactNode }) => (
    <Heading {...props} level={2} />
  ),
  h3: (props: { children?: React.ReactNode }) => (
    <Heading {...props} level={3} />
  ),
  h4: (props: { children?: React.ReactNode }) => (
    <Heading {...props} level={4} />
  ),
  h5: (props: { children?: React.ReactNode }) => (
    <Heading {...props} level={5} />
  ),
  h6: (props: { children?: React.ReactNode }) => (
    <Heading {...props} level={6} />
  ),
  img: FancyBoxImage,
  Link,
};

interface PostPageContext {
  body: string;
  frontmatter: PostFrontmatter;
  id: string;
}

const PostTemplate = ({
  children,
  pageContext,
}: PageProps<object, PostPageContext>) => {
  const { setPageTitle } = React.useContext(GlobalContext);
  const titleRef = React.useRef<HTMLHeadingElement>(null);

  const { title, date: dateString, categories, tags } = pageContext.frontmatter;
  const date = new Date(dateString);

  React.useEffect(() => {
    const titleDom = titleRef.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setPageTitle("");
      } else {
        setPageTitle(title);
      }
    });

    if (titleDom) {
      observer.observe(titleDom);
    }
    return () => {
      if (titleDom) {
        observer.unobserve(titleDom);
      }
    };
  }, [setPageTitle, title]);

  React.useEffect(() => {
    Fancybox.bind("[data-fancybox]");
    return () => Fancybox.unbind("[data-fancybox]");
  });

  return (
    <div className="px-24 pb-48 pt-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-10 flex flex-col gap-4">
          {categories?.length && (
            <Category name={categories[0]} className="text-sm" />
          )}
          <h1 ref={titleRef} className="text-3xl font-bold">
            {title}
          </h1>
          <div className="flex gap-2 text-neutral-100/60">
            <span title={date.toString()}>
              {dayjs(date).format("MM 月 DD 日 YYYY 年")}
            </span>
            {tags?.length && (
              <div className="flex flex-1 flex-wrap gap-2 before:content-['•']">
                {tags.map((tag) => (
                  <Tag key={tag} name={tag} />
                ))}
              </div>
            )}
          </div>
        </div>
        <article className="heti post-entry">
          <MDXProvider components={components}>{children}</MDXProvider>
        </article>
      </div>
    </div>
  );
};

export const Head = ({ pageContext }: HeadProps<object, PostPageContext>) => {
  return <SEO title={pageContext.frontmatter.title} />;
};

export default PostTemplate;
