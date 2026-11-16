import fs from "node:fs";
import path from "node:path";

import type { Root } from "remark-gfm";

import { encodeHashFragment, resolveBlogContent } from "../src/utils/post.ts";

const URL_SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
const MDX_EXT_RE = /\.(mdx?)$/;

export interface ResolveRelativePostLinkOptions {
  url: string;
  sourceFilePath: string;
  blogRoot: string;
  fileExists?: (absPath: string) => boolean;
}

export interface RemarkRelativePostLinksOptions {
  blogRoot?: string;
  fileExists?: (absPath: string) => boolean;
}

interface AstPosition {
  start?: { line?: number; column?: number };
}

interface AstNode {
  type: string;
  url?: string;
  identifier?: string;
  children?: AstNode[];
  position?: AstPosition;
}

interface VFileLike {
  path?: string;
  history?: string[];
  fail?: (reason: string, place?: unknown) => never;
}

function defaultFileExists(absPath: string): boolean {
  try {
    return fs.statSync(absPath).isFile();
  } catch {
    return false;
  }
}

/** 解析 Markdown 中的相对文章链接；非相对文章链接返回 null，无效目标则抛出包含上下文信息的错误 */
export function resolveRelativePostLinkUrl({
  url,
  sourceFilePath,
  blogRoot,
  fileExists = defaultFileExists,
}: ResolveRelativePostLinkOptions): string | null {
  if (
    !url ||
    url.startsWith("#") ||
    url.startsWith("?") ||
    url.startsWith("/") ||
    URL_SCHEME_RE.test(url)
  ) {
    return null;
  }

  const hashIndex = url.indexOf("#");
  const fragment = hashIndex >= 0 ? url.slice(hashIndex) : "";
  const beforeHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;

  const queryIndex = beforeHash.indexOf("?");
  const query = queryIndex >= 0 ? beforeHash.slice(queryIndex) : "";
  const rawPathname =
    queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;

  if (!rawPathname || !MDX_EXT_RE.test(rawPathname)) {
    return null;
  }

  let decodedPathname: string;
  try {
    decodedPathname = decodeURIComponent(rawPathname);
  } catch {
    throw new Error(
      `Invalid percent-encoding in relative post link "${url}" referenced from "${sourceFilePath}".`,
    );
  }

  const targetAbsPath = path.resolve(
    path.dirname(sourceFilePath),
    decodedPathname,
  );

  if (!fileExists(targetAbsPath)) {
    throw new Error(
      `Relative post link target does not exist: "${url}" in "${sourceFilePath}" (resolved to "${targetAbsPath}").`,
    );
  }

  const resolved = resolveBlogContent(path.relative(blogRoot, targetAbsPath));
  if (!resolved) {
    throw new Error(
      `Relative post link target has no page route: "${url}" in "${sourceFilePath}" (resolved to "${targetAbsPath}"), which is outside routable posts/drafts/about-me.`,
    );
  }

  const encodedFragment = encodeHashFragment(fragment);
  return `${resolved.pagePath}${query}${encodedFragment}`;
}

function walkAst(node: AstNode, visitor: (current: AstNode) => void): void {
  visitor(node);
  if (!Array.isArray(node.children)) return;
  for (const child of node.children) {
    walkAst(child, visitor);
  }
}

function formatPositionSuffix(position?: AstPosition): string {
  const line = position?.start?.line;
  const column = position?.start?.column;
  if (typeof line === "number" && typeof column === "number") {
    return ` at ${line}:${column}`;
  }
  return "";
}

/**
 * 将 Markdown 普通链接及被 linkReference 使用的定义中指向 .md/.mdx 的相对路径转换为页面地址。
 * 注册在 mdxOptions.remarkPlugins 中，早于 gatsby-remark-copy-linked-files 执行。
 */
export const remarkRelativePostLinks = (
  options?: RemarkRelativePostLinksOptions,
) => {
  const blogRoot = options?.blogRoot ?? path.resolve("./blog");
  const fileExists = options?.fileExists ?? defaultFileExists;

  return (tree: Root, file?: VFileLike) => {
    const sourceFilePath = file?.path || file?.history?.[0];
    if (!sourceFilePath) return;

    const linkRefIdentifiers = new Set<string>();
    const candidateNodes: AstNode[] = [];

    walkAst(tree as unknown as AstNode, (node) => {
      if (
        node.type === "linkReference" &&
        typeof node.identifier === "string"
      ) {
        linkRefIdentifiers.add(node.identifier);
      } else if (node.type === "link" || node.type === "definition") {
        candidateNodes.push(node);
      }
    });

    for (const node of candidateNodes) {
      if (
        node.type === "definition" &&
        (typeof node.identifier !== "string" ||
          !linkRefIdentifiers.has(node.identifier))
      ) {
        continue;
      }

      if (typeof node.url !== "string") continue;

      try {
        const nextUrl = resolveRelativePostLinkUrl({
          url: node.url,
          sourceFilePath,
          blogRoot,
          fileExists,
        });
        if (nextUrl !== null) {
          node.url = nextUrl;
        }
      } catch (error) {
        const baseMessage =
          error instanceof Error ? error.message : String(error);
        if (typeof file?.fail === "function") {
          file.fail(baseMessage, node.position ?? node);
        }
        throw new Error(
          `${baseMessage}${formatPositionSuffix(node.position)}`,
          { cause: error },
        );
      }
    }
  };
};
