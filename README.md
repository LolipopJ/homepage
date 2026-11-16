<h1 align="center">
  Homepage <small>of Lolipop</small>
</h1>

## Development

Use Node.js 24 or later and pnpm 12 or later.

```bash
pnpm install
pnpm develop
```

Check lint errors:

```bash
pnpm lint
```

Build source locally:

```bash
pnpm build:dry-run
```

## Deployment

Build source with Algolia:

```bash
pnpm build
```

## Content Conventions

### Routing & Directory Index

Slugs come from source paths relative to `blog/posts/` or `blog/drafts/`, with file extensions removed and each segment URL-encoded; frontmatter `slug` is ignored. Slugs retain `index`; only a trailing `index` is collapsed in the page URL.

- Flat post: `blog/posts/example.mdx` → `slug: example`, URL `/posts/example`
- Nested post: `blog/posts/react/hooks.mdx` → `slug: react/hooks`, URL `/posts/react/hooks`
- Nested directory index: `blog/posts/guide/index.mdx` → `slug: guide/index`, URL `/posts/guide`
- Root directory index: `blog/posts/index.md` → `slug: index`, URL `/posts`
- Middle `index` directory is preserved: `blog/posts/guide/index/setup.mdx` → `/posts/guide/index/setup`
- About page: only `blog/about-me.mdx` maps to `/about-me`; `blog/posts/about-me.mdx` maps to `/posts/about-me`
- Drafts: `blog/drafts/guide/setup.mdx` maps to `/posts/guide/setup` (detail page generated, excluded from public lists/RSS/Algolia/sitemap in production)
- Directories without an `index.md` or `index.mdx` do not get an automatic page.
- Route conflicts fail the build with the conflicting URL and all source files (for example `blog/posts/guide.mdx` + `blog/posts/guide/index.md` on `/posts/guide`, or `blog/posts/guide/setup.mdx` + `blog/drafts/guide/setup.mdx` on `/posts/guide/setup`)

### Cover Discovery

- Explicit `frontmatter.banner` (relative to the MDX file) takes priority; missing files or unsupported formats fail the build without falling back to auto-discovery.
- When `frontmatter.banner` is omitted or null/empty, covers are auto-discovered from:
  - Regular post: sibling `<postName>/` directory (e.g. `blog/posts/react/hooks.mdx` → `blog/posts/react/hooks/`)
  - Directory index (`index.md` / `index.mdx`): the index file's own directory (e.g. `blog/posts/guide/index.mdx` → `blog/posts/guide/`)
  - About page: `blog/about-me/`
- Cover lookup follows the source file path, independent of URL encoding.
- Priority & formats: checks lowercase `cover.*` before `banner.*`, supporting lowercase `jpg`, `jpeg`, `png`, `webp`, `avif`, `tif`, `tiff` (`gif` and `svg` are ignored for auto-discovery).
- Ambiguity & empty state: multiple candidates at the active priority (e.g. `cover.jpg` + `cover.png`) fail the build; if `cover.*` yields a unique winner, lower-priority `banner.*` ambiguity is ignored. Posts with no candidates build cleanly without a cover.

### MDX Component Discovery

- Global MDX components are automatically discovered from top-level `.tsx` files in `src/components/mdx/` (non-recursive; nested directories and non-`.tsx` helper files are ignored).
- Each top-level `.tsx` entry must have a `default` export and use lowercase kebab-case naming starting with a letter (e.g. `notice-box.tsx` → `<NoticeBox />`, `game-platform-card.tsx` → `<GamePlatformCard />`). Invalid filenames or missing default exports fail the build/lint.
- Both runtime registration (`src/mdx/components.ts`) and ESLint MDX globals (`eslint.config.mjs`) derive component names from the same rule; adding a component there requires no manual edits to templates or ESLint globals.
- Fixed bindings `Link` (Gatsby `Link`), `a`, and `img` cannot be overridden by auto-discovered files (e.g. `link.tsx` conflicts with `Link` and raises an error).
- Explicit `import` statements and local component definitions inside an MDX file keep native MDX scoping and override global defaults within that file.

### Relative Post Links

- Markdown links and reference-style links targeting relative `.md` / `.mdx` files are resolved relative to the current MDX file at build time (before attachment copying):
  - Same-directory links: `[Setup](./setup.mdx)` or `[Setup](setup.mdx)` → `/posts/guide/setup`
  - Directory index & about page: `[Guide](../guide/index.md)` → `/posts/guide`, `[About](../about-me.mdx)` → `/about-me`
  - Reference-style links preserve link text and title: `[Setup][setup]` with `[setup]: ./setup.mdx "Setup guide"`
  - Query parameters and hash fragments are preserved and encoded once without double-encoding (e.g. `./setup.mdx?view=compact#数据备份`)
- Internal `/posts` and `/about-me` links navigate via Gatsby `Link` without forcing `target="_blank"`.
- External URLs (e.g. `https://example.com/README.md`), hash-only links, attachments, images, code blocks, inline code, JSX `<Link>`, and paths without `.md` / `.mdx` extensions (`./guide/`, `./setup`) are left untouched; directories and extensions are never guessed.
- Missing targets, invalid percent-encoding, or `.md` / `.mdx` files outside the routable `posts/`, `drafts/`, and `about-me.mdx` scope fail the build with source position details.
