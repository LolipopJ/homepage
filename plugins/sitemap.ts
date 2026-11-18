import dayjs from "dayjs";
import fs from "fs/promises";
import path from "path";

import {
  getCanonicalUrl,
  normalizeRoutePath,
  resolveBlogContent,
  type ResolvedBlogContent,
} from "../src/utils/post.ts";

export interface SitemapItem {
  path: string;
  lastmod?: string;
  changefreq?:
    "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

export interface SitePageQueryResult {
  path: string;
}

export interface MdxQueryResult {
  fields?: {
    slug?: string;
    isPublic?: boolean;
    isDraft?: boolean;
  };
  frontmatter?: {
    date?: string;
    updated?: string;
  };
  internal?: {
    contentFilePath?: string;
  };
}

const EXCLUDED_PATTERNS = [
  /^\/404(\.html)?\/?$/,
  /^\/dev-404-page\/?$/,
  /^\/offline-plugin-app-shell-fallback\/?$/,
];

export function formatLastmod(dateStr?: string | null): string | undefined {
  if (!dateStr) return undefined;
  const d = dayjs(dateStr);
  return d.isValid() ? d.format("YYYY-MM-DD") : undefined;
}

export function extractSitemapItems(
  pages: SitePageQueryResult[],
  mdxNodes: MdxQueryResult[],
  blogRoot: string = path.resolve("./blog"),
): SitemapItem[] {
  const mdxByRoute = new Map<
    string,
    { node: MdxQueryResult; resolved: ResolvedBlogContent }
  >();
  let latestPostDate: string | undefined;

  for (const node of mdxNodes) {
    const contentFilePath = node.internal?.contentFilePath;
    if (!contentFilePath) continue;

    const resolved = resolveBlogContent(
      path.relative(blogRoot, contentFilePath),
    );
    if (!resolved) continue;

    mdxByRoute.set(normalizeRoutePath(resolved.pagePath), { node, resolved });

    if (resolved.isPublic && !resolved.isDraft) {
      const postDate = node.frontmatter?.updated || node.frontmatter?.date;
      if (postDate) {
        const formatted = formatLastmod(postDate);
        if (formatted && (!latestPostDate || formatted > latestPostDate)) {
          latestPostDate = formatted;
        }
      }
    }
  }

  const items: SitemapItem[] = [];

  for (const page of pages) {
    const rawPath = page.path;

    // Check excluded patterns
    if (EXCLUDED_PATTERNS.some((pattern) => pattern.test(rawPath))) {
      continue;
    }

    const normalized = normalizeRoutePath(rawPath);
    const mdxEntry = mdxByRoute.get(normalized);

    if (mdxEntry) {
      const { node: mdxNode, resolved } = mdxEntry;
      const lastmod = formatLastmod(
        mdxNode.frontmatter?.updated || mdxNode.frontmatter?.date,
      );

      if (resolved.kind === "about-me") {
        items.push({
          path: rawPath,
          lastmod,
          changefreq: "monthly",
          priority: 0.8,
        });
        continue;
      }

      // Exclude draft posts or non-public posts
      if (resolved.isDraft || !resolved.isPublic) {
        continue;
      }

      items.push({
        path: rawPath,
        lastmod,
        changefreq: "weekly",
        priority: 0.8,
      });
      continue;
    }

    // Home page
    if (rawPath === "/" || rawPath === "") {
      items.push({
        path: "/",
        lastmod: latestPostDate,
        changefreq: "daily",
        priority: 1.0,
      });
      continue;
    }

    // About me page fallback
    if (normalized === "/about-me") {
      items.push({
        path: rawPath,
        changefreq: "monthly",
        priority: 0.8,
      });
      continue;
    }

    // Post page fallback
    if (normalized === "/posts" || normalized.startsWith("/posts/")) {
      items.push({
        path: rawPath,
        changefreq: "weekly",
        priority: 0.8,
      });
      continue;
    }

    // Category / Tag list pages
    const isCategoryOrTag =
      rawPath.startsWith("/categories/") || rawPath.startsWith("/tags/");
    if (isCategoryOrTag) {
      const isIndex =
        rawPath === "/categories/" ||
        rawPath === "/tags/" ||
        rawPath === "/categories" ||
        rawPath === "/tags";
      items.push({
        path: rawPath,
        changefreq: "weekly",
        priority: isIndex ? 0.5 : 0.6,
      });
      continue;
    }

    // Other pages
    items.push({
      path: rawPath,
      changefreq: "weekly",
      priority: 0.5,
    });
  }

  return items.sort((a, b) => a.path.localeCompare(b.path));
}

export function buildUrlsetXml(siteUrl: string, items: SitemapItem[]): string {
  const urlEntries = items
    .map((item) => {
      const loc = getCanonicalUrl(siteUrl, item.path);
      const lines = [
        "  <url>",
        `    <loc>${loc}</loc>`,
        item.lastmod ? `    <lastmod>${item.lastmod}</lastmod>` : null,
        item.changefreq
          ? `    <changefreq>${item.changefreq}</changefreq>`
          : null,
        item.priority !== undefined
          ? `    <priority>${item.priority.toFixed(1)}</priority>`
          : null,
        "  </url>",
      ].filter(Boolean);

      return lines.join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;
}

export async function generateSitemap(
  publicDir: string,
  siteUrl: string,
  pages: SitePageQueryResult[],
  mdxNodes: MdxQueryResult[],
  blogRoot: string = path.resolve("./blog"),
): Promise<void> {
  const items = extractSitemapItems(pages, mdxNodes, blogRoot);
  const xml = buildUrlsetXml(siteUrl, items);

  await fs.mkdir(publicDir, { recursive: true });
  await Promise.all([fs.writeFile(path.join(publicDir, "sitemap.xml"), xml)]);
}
