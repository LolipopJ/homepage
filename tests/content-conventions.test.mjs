import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import * as postUtils from "../src/utils/post.ts";

test("content routing resolves flat, nested, index, encoded, Windows, and about-me paths", () => {
  assert.equal(
    typeof postUtils.resolveBlogContent,
    "function",
    "resolveBlogContent must be exported from src/utils/post.ts",
  );
  assert.equal(
    typeof postUtils.getPostPath,
    "function",
    "getPostPath must be exported from src/utils/post.ts",
  );

  const flat = postUtils.resolveBlogContent("posts/example.mdx");
  assert.deepEqual(
    {
      kind: flat.kind,
      slug: flat.slug,
      pagePath: flat.pagePath,
      isPublic: flat.isPublic,
      isDraft: flat.isDraft,
    },
    {
      kind: "post",
      slug: "example",
      pagePath: "/posts/example",
      isPublic: true,
      isDraft: false,
    },
  );

  const nestedMd = postUtils.resolveBlogContent("posts/react/hooks.md");
  assert.deepEqual(
    {
      kind: nestedMd.kind,
      slug: nestedMd.slug,
      pagePath: nestedMd.pagePath,
      isPublic: nestedMd.isPublic,
      isDraft: nestedMd.isDraft,
    },
    {
      kind: "post",
      slug: "react/hooks",
      pagePath: "/posts/react/hooks",
      isPublic: true,
      isDraft: false,
    },
  );

  const nestedIndex = postUtils.resolveBlogContent("posts/guide/index.mdx");
  assert.deepEqual(
    {
      kind: nestedIndex.kind,
      slug: nestedIndex.slug,
      pagePath: nestedIndex.pagePath,
    },
    {
      kind: "post",
      slug: "guide/index",
      pagePath: "/posts/guide",
    },
  );

  const rootIndex = postUtils.resolveBlogContent("posts/index.md");
  assert.deepEqual(
    {
      kind: rootIndex.kind,
      slug: rootIndex.slug,
      pagePath: rootIndex.pagePath,
    },
    {
      kind: "post",
      slug: "index",
      pagePath: "/posts",
    },
  );

  const middleIndex = postUtils.resolveBlogContent(
    "posts/guide/index/setup.mdx",
  );
  assert.equal(middleIndex.slug, "guide/index/setup");
  assert.equal(middleIndex.pagePath, "/posts/guide/index/setup");

  const chineseWindows = postUtils.resolveBlogContent(
    "posts\\中文 目录\\入门 指南.mdx",
  );
  const expectedSlug = `${encodeURIComponent("中文 目录")}/${encodeURIComponent("入门 指南")}`;
  assert.equal(chineseWindows.slug, expectedSlug);
  assert.equal(chineseWindows.pagePath, `/posts/${expectedSlug}`);
  assert.ok(!chineseWindows.pagePath.includes("%2F"));

  const aboutMe = postUtils.resolveBlogContent("about-me.mdx");
  assert.deepEqual(
    {
      kind: aboutMe.kind,
      slug: aboutMe.slug,
      pagePath: aboutMe.pagePath,
      isPublic: aboutMe.isPublic,
      isDraft: aboutMe.isDraft,
    },
    {
      kind: "about-me",
      slug: "about-me",
      pagePath: "/about-me",
      isPublic: false,
      isDraft: false,
    },
  );

  const postAboutMe = postUtils.resolveBlogContent("posts/about-me.mdx");
  assert.deepEqual(
    {
      kind: postAboutMe.kind,
      slug: postAboutMe.slug,
      pagePath: postAboutMe.pagePath,
      isPublic: postAboutMe.isPublic,
      isDraft: postAboutMe.isDraft,
    },
    {
      kind: "post",
      slug: "about-me",
      pagePath: "/posts/about-me",
      isPublic: true,
      isDraft: false,
    },
  );

  const draft = postUtils.resolveBlogContent("drafts\\guide\\setup.mdx");
  assert.deepEqual(
    {
      kind: draft.kind,
      slug: draft.slug,
      pagePath: draft.pagePath,
      isPublic: draft.isPublic,
      isDraft: draft.isDraft,
    },
    {
      kind: "draft",
      slug: "guide/setup",
      pagePath: "/posts/guide/setup",
      isPublic: false,
      isDraft: true,
    },
  );

  assert.equal(postUtils.resolveBlogContent("notes.md"), null);
  assert.equal(postUtils.resolveBlogContent("posts/guide/banner.png"), null);

  assert.equal(postUtils.getPostPath("index"), "/posts");
  assert.equal(postUtils.getPostPath("guide/index"), "/posts/guide");
  assert.equal(
    postUtils.getPostPath("guide/index/setup"),
    "/posts/guide/index/setup",
  );
});

test("route conflict detection reports normalized path and all conflicting sources", () => {
  assert.throws(
    () =>
      postUtils.assertNoRouteConflicts([
        {
          pagePath: postUtils.resolveBlogContent("posts/guide.mdx").pagePath,
          sourcePath: "blog/posts/guide.mdx",
        },
        {
          pagePath: postUtils.resolveBlogContent("posts/guide/index.md")
            .pagePath,
          sourcePath: "blog/posts/guide/index.md",
        },
      ]),
    (err) =>
      err instanceof Error &&
      err.message.includes("/posts/guide") &&
      err.message.includes("blog/posts/guide.mdx") &&
      err.message.includes("blog/posts/guide/index.md"),
  );

  assert.throws(
    () =>
      postUtils.assertNoRouteConflicts([
        {
          pagePath: postUtils.resolveBlogContent("posts/guide/setup.mdx")
            .pagePath,
          sourcePath: "blog/posts/guide/setup.mdx",
        },
        {
          pagePath: postUtils.resolveBlogContent("drafts/guide/setup.mdx")
            .pagePath,
          sourcePath: "blog/drafts/guide/setup.mdx",
        },
      ]),
    (err) =>
      err instanceof Error &&
      err.message.includes("/posts/guide/setup") &&
      err.message.includes("blog/posts/guide/setup.mdx") &&
      err.message.includes("blog/drafts/guide/setup.mdx"),
  );

  assert.doesNotThrow(() =>
    postUtils.assertNoRouteConflicts([
      {
        pagePath: postUtils.resolveBlogContent("about-me.mdx").pagePath,
        sourcePath: "blog/about-me.mdx",
      },
      {
        pagePath: postUtils.resolveBlogContent("posts/about-me.mdx").pagePath,
        sourcePath: "blog/posts/about-me.mdx",
      },
    ]),
  );
});

test("post cover discovery handles explicit, invalid explicit, resource dirs, formats, priority, conflicts, and no-cover", async () => {
  const {
    SUPPORTED_COVER_EXTENSIONS,
    resolveCoverRelativePath,
    selectAutoCoverCandidate,
  } = await import("../plugins/post-cover.ts");

  assert.deepEqual(
    [...SUPPORTED_COVER_EXTENSIONS],
    ["jpg", "jpeg", "png", "webp", "avif", "tif", "tiff"],
  );

  const blogRoot = path.resolve("blog");

  // Regular & nested post resource directory vs index directory
  assert.equal(
    postUtils.resolveBlogContent("posts/react/hooks.mdx").coverDir,
    "posts/react/hooks",
  );
  assert.equal(
    postUtils.resolveBlogContent("posts/guide/index.mdx").coverDir,
    "posts/guide",
  );
  assert.equal(
    postUtils.resolveBlogContent("drafts/使用指南.mdx").coverDir,
    "drafts/使用指南",
  );

  // cover takes priority over banner; lower priority ambiguity is ignored
  assert.equal(
    selectAutoCoverCandidate(
      ["banner.png", "cover.webp", "banner.jpg"],
      "blog/posts/example.mdx",
      "blog/posts/example",
    ),
    "cover.webp",
  );

  // All supported extensions participate equally; unsupported extensions (gif/svg) ignored
  for (const ext of SUPPORTED_COVER_EXTENSIONS) {
    assert.equal(
      selectAutoCoverCandidate(
        [`banner.${ext}`, "cover.gif", "banner.svg"],
        "blog/posts/example.mdx",
        "blog/posts/example",
      ),
      `banner.${ext}`,
    );
  }

  // Same-priority conflict fails with source and all candidates
  assert.throws(
    () =>
      selectAutoCoverCandidate(
        ["cover.jpg", "cover.png"],
        "blog/posts/example.mdx",
        "blog/posts/example",
      ),
    (err) =>
      err instanceof Error &&
      err.message.includes("blog/posts/example.mdx") &&
      err.message.includes("cover.jpg") &&
      err.message.includes("cover.png"),
  );

  // No candidates -> null (valid no-cover post)
  assert.equal(
    selectAutoCoverCandidate(
      ["cover.gif", "diagram.svg", "notes.txt"],
      "blog/posts/example.mdx",
      "blog/posts/example",
    ),
    null,
  );

  // Explicit banner overrides auto-discovered cover/banner
  assert.equal(
    await resolveCoverRelativePath({
      explicitBanner: "./example/custom.png",
      sourceFilePath: path.join(blogRoot, "posts/example.mdx"),
      blogRoot,
      fileExists: async (absPath) =>
        absPath === path.join(blogRoot, "posts/example/custom.png"),
      listDirFiles: async () => ["cover.webp", "banner.jpg"],
    }),
    "./example/custom.png",
  );

  // Invalid explicit banner (missing or unsupported) fails without falling back to auto-discovery
  await assert.rejects(
    () =>
      resolveCoverRelativePath({
        explicitBanner: "./example/missing.png",
        sourceFilePath: path.join(blogRoot, "posts/example.mdx"),
        blogRoot,
        fileExists: async () => false,
        listDirFiles: async () => ["cover.webp"],
      }),
    (err) =>
      err instanceof Error &&
      err.message.includes("example.mdx") &&
      err.message.includes("./example/missing.png"),
  );

  await assert.rejects(
    () =>
      resolveCoverRelativePath({
        explicitBanner: "./example/anim.gif",
        sourceFilePath: path.join(blogRoot, "posts/example.mdx"),
        blogRoot,
        fileExists: async () => true,
        listDirFiles: async () => ["cover.webp"],
      }),
    (err) =>
      err instanceof Error &&
      err.message.includes("example.mdx") &&
      err.message.includes("./example/anim.gif"),
  );

  // Directory index auto-discovers in its own directory, not guide/index/
  assert.equal(
    await resolveCoverRelativePath({
      explicitBanner: null,
      sourceFilePath: path.join(blogRoot, "posts/guide/index.mdx"),
      blogRoot,
      fileExists: async () => false,
      listDirFiles: async (dir) =>
        dir === path.join(blogRoot, "posts/guide") ? ["banner.jpg"] : [],
    }),
    "banner.jpg",
  );

  // Chinese filename uses real filesystem directory rather than encoded URL
  assert.equal(
    await resolveCoverRelativePath({
      explicitBanner: undefined,
      sourceFilePath: path.join(blogRoot, "drafts/使用指南.mdx"),
      blogRoot,
      fileExists: async () => false,
      listDirFiles: async (dir) =>
        dir === path.join(blogRoot, "drafts/使用指南") ? ["cover.webp"] : [],
    }),
    "使用指南/cover.webp",
  );
});

test("relative post link resolution converts valid relative post links and rejects invalid targets", async () => {
  const { resolveRelativePostLinkUrl } =
    await import("../plugins/remark-relative-post-links.ts");

  const blogRoot = path.resolve("blog");
  const existingFiles = new Set([
    path.join(blogRoot, "posts/guide/start.mdx"),
    path.join(blogRoot, "posts/guide/setup.mdx"),
    path.join(blogRoot, "posts/guide/index.md"),
    path.join(blogRoot, "posts/index.mdx"),
    path.join(blogRoot, "posts/react/hooks.mdx"),
    path.join(blogRoot, "posts/使用指南.mdx"),
    path.join(blogRoot, "drafts/guide/secret.mdx"),
    path.join(blogRoot, "about-me.mdx"),
    path.join(blogRoot, "notes.md"),
    path.resolve("README.md"),
  ]);
  const fileExists = (absPath) => existingFiles.has(path.resolve(absPath));

  // Bare filename & ./ in same directory
  assert.equal(
    resolveRelativePostLinkUrl({
      url: "setup.mdx",
      sourceFilePath: path.join(blogRoot, "posts/guide/start.mdx"),
      blogRoot,
      fileExists,
    }),
    "/posts/guide/setup",
  );
  assert.equal(
    resolveRelativePostLinkUrl({
      url: "./setup.mdx",
      sourceFilePath: path.join(blogRoot, "posts/guide/start.mdx"),
      blogRoot,
      fileExists,
    }),
    "/posts/guide/setup",
  );

  // ../ cross-directory & directory index folding
  assert.equal(
    resolveRelativePostLinkUrl({
      url: "../guide/index.md",
      sourceFilePath: path.join(blogRoot, "posts/react/hooks.mdx"),
      blogRoot,
      fileExists,
    }),
    "/posts/guide",
  );
  assert.equal(
    resolveRelativePostLinkUrl({
      url: "../index.mdx",
      sourceFilePath: path.join(blogRoot, "posts/react/hooks.mdx"),
      blogRoot,
      fileExists,
    }),
    "/posts",
  );
  assert.equal(
    resolveRelativePostLinkUrl({
      url: "../../about-me.mdx",
      sourceFilePath: path.join(blogRoot, "posts/guide/start.mdx"),
      blogRoot,
      fileExists,
    }),
    "/about-me",
  );

  // Draft target is resolvable to its /posts/ detail URL
  assert.equal(
    resolveRelativePostLinkUrl({
      url: "../../drafts/guide/secret.mdx",
      sourceFilePath: path.join(blogRoot, "posts/guide/start.mdx"),
      blogRoot,
      fileExists,
    }),
    "/posts/guide/secret",
  );

  // Query & hash preservation without double-encoding
  const encodedPost = encodeURIComponent("使用指南");
  const encodedHash = encodeURIComponent("数据备份");
  assert.equal(
    resolveRelativePostLinkUrl({
      url: `../使用指南.mdx?view=compact#数据备份`,
      sourceFilePath: path.join(blogRoot, "posts/guide/start.mdx"),
      blogRoot,
      fileExists,
    }),
    `/posts/${encodedPost}?view=compact#${encodedHash}`,
  );
  assert.equal(
    resolveRelativePostLinkUrl({
      url: `../${encodedPost}.mdx?view=compact#${encodedHash}`,
      sourceFilePath: path.join(blogRoot, "posts/guide/start.mdx"),
      blogRoot,
      fileExists,
    }),
    `/posts/${encodedPost}?view=compact#${encodedHash}`,
  );

  // Non-post URLs remain untouched (returns null)
  for (const untouched of [
    "https://example.com/README.md",
    "http://example.com/a.mdx",
    "mailto:test@example.com",
    "//example.com/a.md",
    "/posts/guide/setup",
    "#section",
    "?view=compact",
    "./guide/",
    "./setup",
    "./diagram.png",
    "./manual.pdf",
  ]) {
    assert.equal(
      resolveRelativePostLinkUrl({
        url: untouched,
        sourceFilePath: path.join(blogRoot, "posts/guide/start.mdx"),
        blogRoot,
        fileExists,
      }),
      null,
      `Expected ${untouched} to remain untouched`,
    );
  }

  // Invalid percent-encoding throws
  assert.throws(
    () =>
      resolveRelativePostLinkUrl({
        url: "./%ZZ.mdx",
        sourceFilePath: path.join(blogRoot, "posts/guide/start.mdx"),
        blogRoot,
        fileExists,
      }),
    (err) => err instanceof Error && err.message.includes("./%ZZ.mdx"),
  );

  // Missing target throws
  assert.throws(
    () =>
      resolveRelativePostLinkUrl({
        url: "./missing.mdx",
        sourceFilePath: path.join(blogRoot, "posts/guide/start.mdx"),
        blogRoot,
        fileExists,
      }),
    (err) =>
      err instanceof Error &&
      err.message.includes("start.mdx") &&
      err.message.includes("./missing.mdx") &&
      err.message.includes("missing.mdx"),
  );

  // Non-routable .md target throws
  assert.throws(
    () =>
      resolveRelativePostLinkUrl({
        url: "../../notes.md",
        sourceFilePath: path.join(blogRoot, "posts/guide/start.mdx"),
        blogRoot,
        fileExists,
      }),
    (err) =>
      err instanceof Error &&
      err.message.includes("../../notes.md") &&
      err.message.includes("notes.md"),
  );
  assert.throws(
    () =>
      resolveRelativePostLinkUrl({
        url: "../../../README.md",
        sourceFilePath: path.join(blogRoot, "posts/guide/start.mdx"),
        blogRoot,
        fileExists,
      }),
    (err) =>
      err instanceof Error &&
      err.message.includes("../../../README.md") &&
      err.message.includes("README.md"),
  );
});

test("remarkRelativePostLinks transforms link & linkReference definitions, keeps images/code/JSX intact, and reports VFile position", async () => {
  const { remarkRelativePostLinks } =
    await import("../plugins/remark-relative-post-links.ts");

  const blogRoot = path.resolve("blog");
  const existingFiles = new Set([
    path.join(blogRoot, "posts/guide/start.mdx"),
    path.join(blogRoot, "posts/guide/setup.mdx"),
  ]);
  const transform = remarkRelativePostLinks({
    blogRoot,
    fileExists: (absPath) => existingFiles.has(path.resolve(absPath)),
  });

  const tree = {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          {
            type: "link",
            url: "./setup.mdx",
            title: "配置指南",
            children: [{ type: "text", value: "配置" }],
          },
          {
            type: "linkReference",
            identifier: "setup-ref",
            referenceType: "full",
            children: [{ type: "text", value: "引用配置" }],
          },
          {
            type: "image",
            url: "./missing.mdx",
            alt: "not a link",
          },
          {
            type: "imageReference",
            identifier: "img-ref",
            referenceType: "full",
          },
          {
            type: "inlineCode",
            value: "[示例](./missing.mdx)",
          },
        ],
      },
      {
        type: "code",
        lang: "md",
        value: "[代码](./missing.mdx)",
      },
      {
        type: "mdxJsxFlowElement",
        name: "Link",
        attributes: [
          { type: "mdxJsxAttribute", name: "to", value: "./missing.mdx" },
        ],
        children: [],
      },
      {
        type: "definition",
        identifier: "setup-ref",
        url: "setup.mdx",
        title: "配置说明",
      },
      {
        type: "definition",
        identifier: "img-ref",
        url: "./missing.mdx",
      },
      {
        type: "definition",
        identifier: "unused-ref",
        url: "./missing.mdx",
      },
    ],
  };

  transform(tree, { path: path.join(blogRoot, "posts/guide/start.mdx") });

  assert.equal(tree.children[0].children[0].url, "/posts/guide/setup");
  assert.equal(tree.children[0].children[0].title, "配置指南");
  assert.equal(tree.children[0].children[0].children[0].value, "配置");
  assert.equal(tree.children[0].children[2].url, "./missing.mdx");
  assert.equal(tree.children[2].attributes[0].value, "./missing.mdx");
  assert.equal(tree.children[3].url, "/posts/guide/setup");
  assert.equal(tree.children[3].title, "配置说明");
  assert.equal(tree.children[4].url, "./missing.mdx");
  assert.equal(tree.children[5].url, "./missing.mdx");

  // VFile fail receives position
  const badTree = {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          {
            type: "link",
            url: "./missing.mdx",
            position: { start: { line: 12, column: 3 } },
            children: [{ type: "text", value: "缺失" }],
          },
        ],
      },
    ],
  };

  let capturedPlace = null;
  assert.throws(
    () =>
      transform(badTree, {
        path: path.join(blogRoot, "posts/guide/start.mdx"),
        fail(reason, place) {
          capturedPlace = place;
          throw new Error(reason);
        },
      }),
    (err) =>
      err instanceof Error &&
      err.message.includes("./missing.mdx") &&
      err.message.includes("start.mdx"),
  );
  assert.deepEqual(capturedPlace, { start: { line: 12, column: 3 } });
});

test("fragment encoding avoids double-encoding and handled anchor keys include normalized page path", () => {
  const encodedHeading = encodeURIComponent("数据备份");
  assert.equal(postUtils.encodeHashFragment("#数据备份"), `#${encodedHeading}`);
  assert.equal(
    postUtils.encodeHashFragment(`#${encodedHeading}`),
    `#${encodedHeading}`,
  );
  assert.equal(postUtils.encodeHashFragment("#100%"), "#100%25");
  assert.equal(postUtils.encodeHashFragment("#100%25"), "#100%25");

  const keyA = postUtils.getHandledAnchorKey("/posts/guide/a/", "#总结");
  const keyB = postUtils.getHandledAnchorKey("/posts/guide/b/", "#总结");
  const keyBEncoded = postUtils.getHandledAnchorKey(
    "/posts/guide/b",
    `#${encodeURIComponent("总结")}`,
  );
  assert.notEqual(keyA, keyB);
  assert.equal(keyB, keyBEncoded);
  assert.equal(postUtils.getHandledAnchorKey("/posts/guide/a", ""), "");
});
