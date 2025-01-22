import { Fancybox } from "@fancyapps/ui";
import { MDXProvider } from "@mdx-js/react";
import { Link, PageProps } from "gatsby";
import { MDXProps } from "mdx/types";
import * as React from "react";

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

const components: MDXProps["components"] = {
  img: FancyBoxImage,
  Link,
};

const PostTemplate = ({
  children,
  pageContext,
}: PageProps<object, { body: string; frontmatter: PostFrontmatter }>) => {
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const [showTitleHeader, setShowTitleHeader] = React.useState<boolean>(false);

  const { title } = pageContext.frontmatter;

  React.useEffect(() => {
    const titleDom = titleRef.current;
    const observer = new IntersectionObserver(([entry]) => {
      setShowTitleHeader(!entry.isIntersecting);
    });

    if (titleDom) {
      observer.observe(titleDom);
    }
    return () => {
      if (titleDom) {
        observer.unobserve(titleDom);
      }
    };
  }, []);

  React.useEffect(() => {
    Fancybox.bind("[data-fancybox]");
    return () => Fancybox.unbind("[data-fancybox]");
  });

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 items-center bg-neutral-900/80 px-8 backdrop-blur-sm">
        {showTitleHeader && (
          <div title={title} className="line-clamp-1 flex-1">
            {title}
          </div>
        )}
        <div className="ml-auto pl-24"></div>
      </header>
      <div className="px-24 pb-48 pt-8">
        <article className="heti post-entry mx-auto max-w-xl">
          <h1 ref={titleRef}>{title}</h1>
          <MDXProvider components={components}>{children}</MDXProvider>
        </article>
      </div>
    </>
  );
};

export default PostTemplate;
