import dayjs from "dayjs";
import { Link } from "gatsby";
import { GatsbyImage, getImage } from "gatsby-plugin-image";
import * as React from "react";

export type PostType = Pick<MdxNode, "excerpt" | "fields" | "frontmatter">;

export interface PostProps {
  post: PostType;
  onClick?: () => void;
  titleRenderer?: (
    title: PostType["frontmatter"]["title"],
    post: PostType,
  ) => React.ReactElement;
  excerptRenderer?: (
    excerpt: PostType["excerpt"],
    post: PostType,
  ) => React.ReactElement;
  size?: "normal" | "large";
  showBanner?: boolean;
  className?: string;
  categoryClassName?: string;
  titleClassName?: string;
  excerptClassName?: string;
  footerClassName?: string;
}

const CATEGORY_GRADIENT_CLASSNAME: Record<string, string> = {
  技术琐事: "from-green-300 via-emerald-300 to-teal-500",
  前端开发: "from-purple-300 via-fuchsia-400 to-pink-500",
  后端开发: "from-sky-300 via-blue-300 to-indigo-400",
  全栈开发: "from-amber-300 via-yellow-400 to-orange-500",
};

/** 博客列表栏的博客简介 */
const Post: React.FC<PostProps> = (props) => {
  const {
    post,
    onClick,
    titleRenderer,
    excerptRenderer,
    size = "normal",
    showBanner: propsShowBanner = false,
    className = "",
    categoryClassName = "",
    titleClassName = "",
    excerptClassName = "",
    footerClassName = "",
  } = props;
  const {
    fields: { slug },
    frontmatter,
    excerpt,
  } = post;
  const {
    banner = null,
    categories = [],
    date: dateString,
    updated: updatedDateString,
    tags = [],
    title,
  } = frontmatter;

  const bannerImage = getImage(banner);
  const showBanner = propsShowBanner && bannerImage;
  const date = dayjs(dateString);
  const updatedDate = updatedDateString ? dayjs(updatedDateString) : date;

  const titleDom = (
    <>
      {categories?.length && (
        <div
          className={`w-fit bg-gradient-to-tr from-0% via-40% to-90% bg-clip-text font-bold text-transparent ${size === "large" ? "text-base" : "text-sm"} ${CATEGORY_GRADIENT_CLASSNAME[categories[0]] ?? ""} ${categoryClassName}`}
        >
          {categories[0]}
        </div>
      )}
      <h1
        title={title}
        className={`line-clamp-3 font-bold ${size === "large" ? "text-lg" : "text-base"} ${titleClassName}`}
      >
        {titleRenderer?.(title, post) || title}
      </h1>
    </>
  );

  return (
    <Link
      to={`/posts/${slug}`}
      onClick={onClick}
      className={`item-selectable flex flex-col gap-1.5 rounded-lg px-4 py-3 ${className}`}
    >
      {showBanner ? (
        <div className="relative -mx-4">
          <GatsbyImage
            image={bannerImage}
            alt="Banner"
            className="h-52 w-full rounded-md object-cover object-center md:h-56 xl:h-60"
            loading="lazy"
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-neutral-900/60 px-4 py-2.5 backdrop-blur-sm">
            {titleDom}
          </div>
        </div>
      ) : (
        titleDom
      )}
      {excerpt && (
        <p title={excerpt} className={`${excerptClassName}`}>
          {excerptRenderer?.(excerpt, post) || excerpt}
        </p>
      )}
      <div
        className={`flex text-foreground-secondary ${size === "large" ? "text-base" : "text-sm"} ${footerClassName}`}
      >
        <div
          title={`首次发布于：${date.toString()}\n最后更新于：${updatedDate.toString()}`}
          className="line-clamp-1"
        >
          {date.format(
            size === "large" ? "MM 月 DD 日 YYYY 年" : "MM月DD日YYYY年",
          )}
        </div>
        {tags?.length && (
          <div
            title={tags.join(" ")}
            className={`line-clamp-1 flex-1 before:content-['•'] ${size === "large" ? "before:mx-1.5" : "before:mx-1"}`}
          >
            {tags.join(" ")}
          </div>
        )}
      </div>
    </Link>
  );
};

export default Post;
