export type BlogContentKind = "post" | "draft" | "about-me";

export interface ResolvedBlogContent {
  kind: BlogContentKind;
  isPublic: boolean;
  isDraft: boolean;
  slug: string;
  pagePath: string;
  coverDir: string;
  relativePath: string;
}

export interface RouteConflictEntry {
  pagePath: string;
  sourcePath: string;
}

export interface RouteConflict {
  pagePath: string;
  sources: string[];
}

const MDX_EXT_RE = /\.(mdx?)$/;
const WINDOWS_DRIVE_RE = /^[a-zA-Z]:/;

function encodeRouteSegment(segment: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(segment));
  } catch {
    return encodeURIComponent(segment);
  }
}

/** 对 URL 片段值执行一次编码：已编码的片段先解码再编码，避免重复编码 % */
export function encodeFragmentValue(value: string): string {
  if (!value) return "";
  return encodeRouteSegment(value);
}

/** 对以 # 开头的 hash 片段执行一次编码 */
export function encodeHashFragment(hash: string): string {
  if (!hash) return "";
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  return `#${encodeFragmentValue(raw)}`;
}

/** 生成由规范化页面路径与一次编码 hash 组成的章节锚点标识 */
export function getHandledAnchorKey(pathname: string, hash: string): string {
  if (!hash) return "";
  const encodedHash = encodeHashFragment(hash);
  if (!encodedHash || encodedHash === "#") return "";
  return `${normalizeRoutePath(pathname)}${encodedHash}`;
}

/** 规范化站内路由路径：统一前导斜杠、去除末尾多余斜杠，并按段一次编码 */
export function normalizeRoutePath(pathname: string): string {
  const trimmed = pathname.trim();
  if (!trimmed || trimmed === "/") return "/";

  const withoutTrailing = trimmed.replace(/\/+$/, "");
  if (!withoutTrailing) return "/";

  const withLeading = withoutTrailing.startsWith("/")
    ? withoutTrailing
    : `/${withoutTrailing}`;

  const segments = withLeading.split("/").slice(1);
  if (segments.length === 0) return "/";

  return `/${segments.map(encodeRouteSegment).join("/")}`;
}

export function getCanonicalUrl(siteUrl: string, pathname: string): string {
  const route = normalizeRoutePath(pathname);
  // Gatsby writes routes ending in .html as files.
  const suffix = route === "/" || pathname.endsWith(".html") ? "" : "/";
  return `${siteUrl}${route}${suffix}`;
}

/** 根据文章 slug 计算对应页面地址，仅折叠末尾的 index 段 */
export function getPostPath(slug: string): string {
  if (!slug || slug === "index") {
    return "/posts";
  }
  if (slug.endsWith("/index")) {
    return `/posts/${slug.slice(0, -"/index".length)}`;
  }
  return `/posts/${slug}`;
}

/** 从博客页面路径识别当前是否处于文章或关于页面 */
export function matchPostRoute(pathname: string): {
  isPostPage: boolean;
  isAboutMe: boolean;
  postSlug?: string;
} {
  const normalized = normalizeRoutePath(pathname);
  if (normalized === "/about-me") {
    return { isPostPage: true, isAboutMe: true, postSlug: "about-me" };
  }
  if (normalized === "/posts") {
    return { isPostPage: true, isAboutMe: false, postSlug: "index" };
  }
  if (normalized.startsWith("/posts/")) {
    return {
      isPostPage: true,
      isAboutMe: false,
      postSlug: normalized.slice("/posts/".length),
    };
  }
  return { isPostPage: false, isAboutMe: false, postSlug: undefined };
}

/** 解析相对于 blog/ 的源文件路径；不属于可路由文章或关于页面时返回 null */
export function resolveBlogContent(
  relativeToBlogPath: string,
): ResolvedBlogContent | null {
  const normalized = relativeToBlogPath
    .replace(/\\/g, "/")
    .replace(/^\.\//, "");

  if (
    !normalized ||
    normalized.startsWith("/") ||
    WINDOWS_DRIVE_RE.test(normalized)
  ) {
    return null;
  }

  const parts = normalized.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) {
    return null;
  }

  if (normalized === "about-me.mdx") {
    return {
      kind: "about-me",
      isPublic: false,
      isDraft: false,
      slug: "about-me",
      pagePath: "/about-me",
      coverDir: "about-me",
      relativePath: normalized,
    };
  }

  const rootDir = parts[0];
  if (rootDir !== "posts" && rootDir !== "drafts") {
    return null;
  }

  const subParts = parts.slice(1);
  if (subParts.length === 0) {
    return null;
  }

  const lastPart = subParts[subParts.length - 1];
  if (!MDX_EXT_RE.test(lastPart)) {
    return null;
  }

  const stemLast = lastPart.replace(MDX_EXT_RE, "");
  if (!stemLast) {
    return null;
  }

  const rawSegments = [...subParts.slice(0, -1), stemLast];
  const encodedSegments = rawSegments.map((segment) =>
    encodeURIComponent(segment),
  );
  const slug = encodedSegments.join("/");
  const pagePath = getPostPath(slug);
  const isIndex = rawSegments[rawSegments.length - 1] === "index";
  const coverDirParts = isIndex
    ? [rootDir, ...rawSegments.slice(0, -1)]
    : [rootDir, ...rawSegments];

  const isPublic = rootDir === "posts";
  const isDraft = rootDir === "drafts";

  return {
    kind: isPublic ? "post" : "draft",
    isPublic,
    isDraft,
    slug,
    pagePath,
    coverDir: coverDirParts.join("/"),
    relativePath: normalized,
  };
}

/** 收集映射到同一规范化页面地址的冲突源文件 */
export function findRouteConflicts(
  entries: RouteConflictEntry[],
): RouteConflict[] {
  const byPath = new Map<string, string[]>();
  for (const entry of entries) {
    const normalized = normalizeRoutePath(entry.pagePath);
    const list = byPath.get(normalized);
    if (list) {
      list.push(entry.sourcePath);
    } else {
      byPath.set(normalized, [entry.sourcePath]);
    }
  }

  const conflicts: RouteConflict[] = [];
  for (const [pagePath, sources] of byPath.entries()) {
    if (sources.length > 1) {
      conflicts.push({ pagePath, sources });
    }
  }
  return conflicts;
}

/** 若存在多个 MDX 源文件映射到同一页面地址则抛出包含完整明细的错误 */
export function assertNoRouteConflicts(entries: RouteConflictEntry[]): void {
  const conflicts = findRouteConflicts(entries);
  if (conflicts.length === 0) return;

  const details = conflicts
    .map(
      ({ pagePath, sources }) =>
        `- ${pagePath}\n${sources.map((source) => `  * ${source}`).join("\n")}`,
    )
    .join("\n");

  throw new Error(`MDX route conflicts detected:\n${details}`);
}
