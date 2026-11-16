import { Link } from "gatsby";
import * as React from "react";

import { encodeHashFragment, matchPostRoute } from "../utils/post";

function parseInternalPostHref(href: string): string | null {
  if (!href.startsWith("/") || href.startsWith("//")) {
    return null;
  }

  const hashIndex = href.indexOf("#");
  const fragment = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const beforeHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;

  const queryIndex = beforeHash.indexOf("?");
  const query = queryIndex >= 0 ? beforeHash.slice(queryIndex) : "";
  const pathname =
    queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;

  if (!matchPostRoute(pathname).isPostPage) {
    return null;
  }

  return `${pathname}${query}${encodeHashFragment(fragment)}`;
}

const ALink: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>> = ({
  href = "",
  children,
  target,
  rel,
  ...restProps
}) => {
  if (href.startsWith("#")) {
    return (
      <a
        href={encodeHashFragment(href)}
        target={target}
        rel={rel}
        {...restProps}
      >
        {children}
      </a>
    );
  }

  const internalPostTo = !target ? parseInternalPostHref(href) : null;
  if (internalPostTo !== null) {
    return (
      <Link to={internalPostTo} {...restProps}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target={target ?? "_blank"}
      rel={rel ?? "noreferrer"}
      {...restProps}
    >
      {children}
    </a>
  );
};

export default ALink;
