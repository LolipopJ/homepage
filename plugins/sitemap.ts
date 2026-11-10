import dayjs from "dayjs";
import fs from "fs/promises";
import path from "path";

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
}

export interface SitemapIndexEntry {
  loc: string;
  lastmod?: string;
}

export const DOMAIN_TOWIND = "https://blog.towind.cn";
export const DOMAIN_GITHUB = "https://lolipopj.github.io";

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

export function normalizePagePath(pagePath: string): string {
  let normalized = pagePath.startsWith("/") ? pagePath : `/${pagePath}`;
  if (!normalized.endsWith("/")) {
    normalized = `${normalized}/`;
  }
  return normalized;
}

export function encodeUrlLoc(siteUrl: string, pagePath: string): string {
  const normalizedBase = siteUrl.replace(/\/+$/, "");
  const normalizedPath = normalizePagePath(pagePath);
  const encodedPath = normalizedPath
    .split("/")
    .map((segment) => {
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join("/");
  return `${normalizedBase}${encodedPath}`;
}

export function extractSitemapItems(
  pages: SitePageQueryResult[],
  mdxNodes: MdxQueryResult[],
): SitemapItem[] {
  const mdxBySlug = new Map<string, MdxQueryResult>();
  let latestPostDate: string | undefined;

  for (const node of mdxNodes) {
    if (node.fields?.slug) {
      mdxBySlug.set(node.fields.slug, node);
      if (node.fields.isPublic && !node.fields.isDraft) {
        const postDate = node.frontmatter?.updated || node.frontmatter?.date;
        if (postDate) {
          const formatted = formatLastmod(postDate);
          if (formatted && (!latestPostDate || formatted > latestPostDate)) {
            latestPostDate = formatted;
          }
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

    // Check if it's a post page
    const postMatch = rawPath.match(/^\/posts\/([^/]+)\/?$/);
    if (postMatch) {
      const slug = postMatch[1];
      const mdxNode = mdxBySlug.get(slug);

      // Exclude draft posts or non-public posts
      if (mdxNode && (mdxNode.fields?.isDraft || !mdxNode.fields?.isPublic)) {
        continue;
      }

      const lastmod = formatLastmod(
        mdxNode?.frontmatter?.updated || mdxNode?.frontmatter?.date,
      );

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

    // About me page
    if (rawPath.startsWith("/about-me")) {
      const mdxNode = mdxBySlug.get("about-me");
      const lastmod = formatLastmod(
        mdxNode?.frontmatter?.updated || mdxNode?.frontmatter?.date,
      );
      items.push({
        path: rawPath,
        lastmod,
        changefreq: "monthly",
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

  // Sort items deterministically: root "/" first, then alphabetically by normalized path
  return items.sort((a, b) => {
    const pathA = normalizePagePath(a.path);
    const pathB = normalizePagePath(b.path);
    if (pathA === "/") return -1;
    if (pathB === "/") return 1;
    return pathA.localeCompare(pathB);
  });
}

export function buildUrlsetXml(siteUrl: string, items: SitemapItem[]): string {
  const urlEntries = items
    .map((item) => {
      const loc = encodeUrlLoc(siteUrl, item.path);
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

export function buildSitemapIndexXml(entries: SitemapIndexEntry[]): string {
  const sitemapEntries = entries
    .map(({ loc, lastmod }) => {
      const lines = [
        "  <sitemap>",
        `    <loc>${loc}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
        "  </sitemap>",
      ].filter(Boolean);

      return lines.join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>
`;
}

export async function generateSitemaps(
  publicDir: string,
  pages: SitePageQueryResult[],
  mdxNodes: MdxQueryResult[],
): Promise<void> {
  const items = extractSitemapItems(pages, mdxNodes);
  const homeItem = items.find((item) => item.path === "/");
  const latestPostDate = homeItem?.lastmod;

  // Generate XML contents for each domain
  const xmlTowind = buildUrlsetXml(DOMAIN_TOWIND, items);
  const xmlGithub = buildUrlsetXml(DOMAIN_GITHUB, items);

  // Single unified sitemap-index.xml listing both domain urlsets
  const indexXml = buildSitemapIndexXml([
    {
      loc: `${DOMAIN_TOWIND}/sitemap-towind.xml`,
      lastmod: latestPostDate,
    },
    {
      loc: `${DOMAIN_GITHUB}/sitemap-github.xml`,
      lastmod: latestPostDate,
    },
  ]);

  // Ensure publicDir exists
  await fs.mkdir(publicDir, { recursive: true });

  // Clean up stale sitemap files from previous builds if present
  const staleFiles = [
    "sitemap.xml",
    "sitemap-0.xml",
    "sitemap-lolipopj.xml",
    "sitemap-index-github.xml",
  ];
  await Promise.all(
    staleFiles.map(async (file) => {
      try {
        await fs.unlink(path.join(publicDir, file));
      } catch {
        // ignore if not present
      }
    }),
  );

  // Write sitemap urlsets for each domain and the unified index
  await fs.writeFile(
    path.join(publicDir, "sitemap-towind.xml"),
    xmlTowind,
    "utf8",
  );
  await fs.writeFile(
    path.join(publicDir, "sitemap-github.xml"),
    xmlGithub,
    "utf8",
  );
  await fs.writeFile(
    path.join(publicDir, "sitemap-index.xml"),
    indexXml,
    "utf8",
  );
}
