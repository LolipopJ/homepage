import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildUrlsetXml,
  extractSitemapItems,
  formatLastmod,
  generateSitemap,
} from "../plugins/sitemap.ts";
import { getCanonicalUrl } from "../src/utils/post.ts";

const siteUrl = "https://blog.towind.cn";

test("formatLastmod formats valid dates and handles falsy values", () => {
  assert.equal(formatLastmod("2026-11-10T00:00:00.000Z"), "2026-11-10");
  assert.equal(formatLastmod("2026-11-10"), "2026-11-10");
  assert.equal(formatLastmod(null), undefined);
  assert.equal(formatLastmod(undefined), undefined);
  assert.equal(formatLastmod("invalid-date"), undefined);
});

test("getCanonicalUrl matches Gatsby's directory and file URLs", () => {
  assert.equal(
    getCanonicalUrl(siteUrl, "/tags/100%"),
    "https://blog.towind.cn/tags/100%25/",
  );
  assert.equal(
    getCanonicalUrl(siteUrl, "/tags/100%25/"),
    "https://blog.towind.cn/tags/100%25/",
  );
  assert.equal(
    getCanonicalUrl(siteUrl, "/categories/生活 闲暇/"),
    `https://blog.towind.cn/categories/${encodeURIComponent("生活")}%20${encodeURIComponent("闲暇")}/`,
  );
  assert.equal(
    getCanonicalUrl(siteUrl, "/posts/example.html"),
    "https://blog.towind.cn/posts/example.html",
  );
});

test("extractSitemapItems excludes 404 pages and drafts, includes public posts with lastmod", () => {
  const pages = [
    { path: "/404/" },
    { path: "/404.html" },
    { path: "/dev-404-page/" },
    { path: "/" },
    { path: "/about-me/" },
    { path: "/categories/tech/" },
    { path: "/posts/public-post/" },
    { path: "/posts/draft-post/" },
  ];

  const mdxNodes = [
    {
      fields: { slug: "public-post", isPublic: true, isDraft: false },
      frontmatter: { date: "2026-05-01", updated: "2026-05-10" },
      internal: { contentFilePath: path.resolve("blog/posts/public-post.mdx") },
    },
    {
      fields: { slug: "draft-post", isPublic: false, isDraft: true },
      frontmatter: { date: "2026-06-01" },
      internal: { contentFilePath: path.resolve("blog/drafts/draft-post.mdx") },
    },
    {
      fields: { slug: "about-me", isPublic: false, isDraft: false },
      frontmatter: { updated: "2026-01-01" },
      internal: { contentFilePath: path.resolve("blog/about-me.mdx") },
    },
  ];

  const items = extractSitemapItems(pages, mdxNodes);

  // Excluded paths
  assert.ok(!items.some((i) => i.path.includes("404")));
  assert.ok(!items.some((i) => i.path.includes("draft-post")));

  // Included paths
  const home = items.find((i) => i.path === "/");
  assert.ok(home);
  assert.equal(home.priority, 1.0);
  assert.equal(home.lastmod, "2026-05-10"); // Newest post date

  const publicPost = items.find((i) => i.path === "/posts/public-post/");
  assert.ok(publicPost);
  assert.equal(publicPost.lastmod, "2026-05-10");
  assert.equal(publicPost.priority, 0.8);

  const aboutMe = items.find((i) => i.path === "/about-me/");
  assert.ok(aboutMe);
  assert.equal(aboutMe.lastmod, "2026-01-01");
});

test("buildUrlsetXml generates valid sitemap xml with encoded absolute URLs", () => {
  const items = [
    { path: "/", lastmod: "2026-11-10", changefreq: "daily", priority: 1.0 },
    {
      path: "/posts/hello/",
      lastmod: "2026-11-09",
      changefreq: "weekly",
      priority: 0.8,
    },
    { path: "/tags/生活 闲暇/", changefreq: "weekly", priority: 0.6 },
  ];

  const xml = buildUrlsetXml(siteUrl, items);
  assert.ok(xml.includes("<urlset"));
  assert.ok(xml.includes("<loc>https://blog.towind.cn/</loc>"));
  assert.ok(xml.includes("<loc>https://blog.towind.cn/posts/hello/</loc>"));
  assert.ok(
    xml.includes(
      `<loc>https://blog.towind.cn/tags/${encodeURIComponent("生活")}%20${encodeURIComponent("闲暇")}/</loc>`,
    ),
  );
});

test("generateSitemaps writes only the canonical sitemap", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sitemap-test-"));
  try {
    // Simulate stale files from prior builds
    await fs.writeFile(path.join(tempDir, "sitemap-github.xml"), "old");
    await fs.writeFile(path.join(tempDir, "sitemap-index.xml"), "old");

    const pages = [
      { path: "/" },
      { path: "/posts/test/" },
      { path: "/about-me/" },
    ];
    const mdxNodes = [
      {
        fields: { slug: "test", isPublic: true, isDraft: false },
        frontmatter: { date: "2026-10-01" },
        internal: { contentFilePath: path.resolve("blog/posts/test.mdx") },
      },
    ];

    await generateSitemap(tempDir, siteUrl, pages, mdxNodes);

    assert.deepEqual(await fs.readdir(tempDir), ["sitemap.xml"]);
    const sitemap = await fs.readFile(
      path.join(tempDir, "sitemap.xml"),
      "utf8",
    );
    assert.ok(
      sitemap.includes("<loc>https://blog.towind.cn/posts/test/</loc>"),
    );
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test("extractSitemapItems maps nested posts, root/nested index pages, coexisting about-me, and excludes nested drafts", () => {
  const pages = [
    { path: "/" },
    { path: "/posts/" },
    { path: "/posts/guide/" },
    { path: "/posts/react/hooks/" },
    { path: "/posts/about-me/" },
    { path: "/about-me/" },
    { path: "/posts/draft-dir/secret/" },
    { path: "/posts/draft-index/" },
  ];

  const mdxNodes = [
    {
      frontmatter: { date: "2026-01-01", updated: "2026-02-01" },
      internal: { contentFilePath: path.resolve("blog/posts/index.md") },
    },
    {
      frontmatter: { date: "2026-02-05" },
      internal: { contentFilePath: path.resolve("blog/posts/guide/index.mdx") },
    },
    {
      frontmatter: { date: "2026-03-01", updated: "2026-03-10" },
      internal: { contentFilePath: path.resolve("blog/posts/react/hooks.mdx") },
    },
    {
      frontmatter: { updated: "2026-04-01" },
      internal: { contentFilePath: path.resolve("blog/posts/about-me.mdx") },
    },
    {
      frontmatter: { updated: "2026-01-15" },
      internal: { contentFilePath: path.resolve("blog/about-me.mdx") },
    },
    {
      frontmatter: { date: "2026-12-01" },
      internal: {
        contentFilePath: path.resolve("blog/drafts/draft-dir/secret.mdx"),
      },
    },
    {
      frontmatter: { date: "2026-12-05" },
      internal: {
        contentFilePath: path.resolve("blog/drafts/draft-index/index.mdx"),
      },
    },
  ];

  const items = extractSitemapItems(pages, mdxNodes);

  assert.equal(items.find((i) => i.path === "/")?.lastmod, "2026-04-01");
  assert.equal(items.find((i) => i.path === "/posts/")?.lastmod, "2026-02-01");
  assert.equal(
    items.find((i) => i.path === "/posts/guide/")?.lastmod,
    "2026-02-05",
  );
  assert.equal(
    items.find((i) => i.path === "/posts/react/hooks/")?.lastmod,
    "2026-03-10",
  );
  assert.equal(
    items.find((i) => i.path === "/posts/about-me/")?.lastmod,
    "2026-04-01",
  );
  assert.equal(
    items.find((i) => i.path === "/about-me/")?.lastmod,
    "2026-01-15",
  );

  assert.ok(!items.some((i) => i.path.includes("draft-dir")));
  assert.ok(!items.some((i) => i.path.includes("draft-index")));
});
