import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildSitemapIndexXml,
  buildUrlsetXml,
  DOMAIN_GITHUB,
  DOMAIN_TOWIND,
  encodeUrlLoc,
  extractSitemapItems,
  formatLastmod,
  generateSitemaps,
} from "../plugins/sitemap.ts";

test("formatLastmod formats valid dates and handles falsy values", () => {
  assert.equal(formatLastmod("2026-11-10T00:00:00.000Z"), "2026-11-10");
  assert.equal(formatLastmod("2026-11-10"), "2026-11-10");
  assert.equal(formatLastmod(null), undefined);
  assert.equal(formatLastmod(undefined), undefined);
  assert.equal(formatLastmod("invalid-date"), undefined);
});

test("encodeUrlLoc handles bare % and special characters safely", () => {
  assert.equal(
    encodeUrlLoc(DOMAIN_TOWIND, "/tags/100%/"),
    "https://blog.towind.cn/tags/100%25/",
  );
  assert.equal(
    encodeUrlLoc(DOMAIN_TOWIND, "/tags/100%25/"),
    "https://blog.towind.cn/tags/100%25/",
  );
  assert.equal(
    encodeUrlLoc(DOMAIN_TOWIND, "/categories/生活 闲暇/"),
    `https://blog.towind.cn/categories/${encodeURIComponent("生活")}%20${encodeURIComponent("闲暇")}/`,
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
    },
    {
      fields: { slug: "draft-post", isPublic: false, isDraft: true },
      frontmatter: { date: "2026-06-01" },
    },
    {
      fields: { slug: "about-me", isPublic: true, isDraft: false },
      frontmatter: { updated: "2026-01-01" },
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

test("buildUrlsetXml generates valid sitemap xml without cross-domain pollution", () => {
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

  const towindXml = buildUrlsetXml(DOMAIN_TOWIND, items);
  assert.ok(towindXml.includes("<urlset"));
  assert.ok(towindXml.includes("<loc>https://blog.towind.cn/</loc>"));
  assert.ok(
    towindXml.includes("<loc>https://blog.towind.cn/posts/hello/</loc>"),
  );
  assert.ok(
    towindXml.includes(
      `<loc>https://blog.towind.cn/tags/${encodeURIComponent("生活")}%20${encodeURIComponent("闲暇")}/</loc>`,
    ),
  );
  assert.ok(!towindXml.includes("github.io"));

  const githubXml = buildUrlsetXml(DOMAIN_GITHUB, items);
  assert.ok(githubXml.includes("<loc>https://lolipopj.github.io/</loc>"));
  assert.ok(
    githubXml.includes("<loc>https://lolipopj.github.io/posts/hello/</loc>"),
  );
  assert.ok(!githubXml.includes("towind.cn"));
});

test("buildSitemapIndexXml creates sitemapindex pointing to both domain urlsets", () => {
  const indexXml = buildSitemapIndexXml([
    {
      loc: "https://blog.towind.cn/sitemap-towind.xml",
      lastmod: "2026-11-10",
    },
    {
      loc: "https://lolipopj.github.io/sitemap-github.xml",
      lastmod: "2026-11-10",
    },
  ]);
  assert.ok(indexXml.includes("<sitemapindex"));
  assert.ok(
    indexXml.includes("<loc>https://blog.towind.cn/sitemap-towind.xml</loc>"),
  );
  assert.ok(
    indexXml.includes(
      "<loc>https://lolipopj.github.io/sitemap-github.xml</loc>",
    ),
  );
});

test("generateSitemaps writes only the required three sitemap files to public directory", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sitemap-test-"));
  try {
    // Simulate stale files from prior builds
    await fs.writeFile(path.join(tempDir, "sitemap.xml"), "old");
    await fs.writeFile(path.join(tempDir, "sitemap-0.xml"), "old");

    const pages = [
      { path: "/" },
      { path: "/posts/test/" },
      { path: "/about-me/" },
    ];
    const mdxNodes = [
      {
        fields: { slug: "test", isPublic: true, isDraft: false },
        frontmatter: { date: "2026-10-01" },
      },
    ];

    await generateSitemaps(tempDir, pages, mdxNodes);

    // Verify only the 3 canonical files exist
    const files = await fs.readdir(tempDir);
    assert.deepEqual(files.sort(), [
      "sitemap-github.xml",
      "sitemap-index.xml",
      "sitemap-towind.xml",
    ]);

    // Verify content of github sitemap
    const githubContent = await fs.readFile(
      path.join(tempDir, "sitemap-github.xml"),
      "utf8",
    );
    assert.ok(githubContent.includes("https://lolipopj.github.io/posts/test/"));
    assert.ok(!githubContent.includes("towind.cn"));

    // Verify content of towind sitemap
    const towindContent = await fs.readFile(
      path.join(tempDir, "sitemap-towind.xml"),
      "utf8",
    );
    assert.ok(towindContent.includes("https://blog.towind.cn/posts/test/"));
    assert.ok(!towindContent.includes("github.io"));

    // Verify content of index sitemap contains both
    const indexContent = await fs.readFile(
      path.join(tempDir, "sitemap-index.xml"),
      "utf8",
    );
    assert.ok(
      indexContent.includes("https://blog.towind.cn/sitemap-towind.xml"),
    );
    assert.ok(
      indexContent.includes("https://lolipopj.github.io/sitemap-github.xml"),
    );
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
