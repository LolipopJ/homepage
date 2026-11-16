# Proposal

## Why

文章封面、站内引用和页面地址目前需要分别维护：35 篇文章显式填写封面，其中 32 篇已使用同名目录中的 `banner.*`；站内引用常需手写页面 URL，路由生成只读取文件名，MDX 可用组件又要在模板和 ESLint 中重复登记。让文件和目录直接表达这些关系，可以减少重复配置，并支持按目录组织文章、资源及可复用的 MDX 组件。

## What Changes

- 封面按「显式 `frontmatter.banner`、约定目录中的 `cover.*`、`banner.*`」依次确定，支持 `jpg`、`jpeg`、`png`、`webp`、`avif`、`tif`、`tiff`；没有候选时允许无封面，同一优先级出现多张图片时报错。
- 普通文章从 `./<postName>/` 自动发现封面；`index.md` / `index.mdx` 目录首页从自身所在目录发现封面。所有封面消费入口使用相同的解析结果。
- 相对于 `blog/posts/` 或 `blog/drafts/` 的目录层级映射到 `/posts/` 下的页面地址，末尾的 `index` 折叠为父目录地址；`blog/about-me.mdx` 继续使用 `/about-me`。
- **BREAKING**：嵌套文章的地址采用目录层级，替换仅取文件名的规则，不保留旧地址或生成重定向。现有平铺文章的地址自然保持原样。
- 新增 MDX 组件发现约定：`src/components/mdx/` 顶层的 `*.tsx` 文件使用 kebab-case 命名并默认导出组件，文件名映射到 PascalCase 标签，例如 `game-card.tsx` 对应 `<GameCard />`。新增组件无需再编辑文章模板和 ESLint 名单。
- 将现有六个创作组件移入约定目录，运行时与 ESLint 依据同一文件集合和命名规则发现组件；保留现有七个公开标签名称。`Link`、`a`、`img` 为固定语义绑定，自动发现不能覆盖它们；MDX 的显式导入与局部组件定义继续遵循原生作用域。
- Markdown 中指向 `.md` / `.mdx` 源文件的相对文章链接，在构建时转换为对应页面地址；保留查询参数和片段，支持普通链接及引用式链接。
- 路由冲突、无法解析的相对文章引用以及无效的显式封面配置提供包含源文件位置的构建错误。
- 草稿继续生成生产详情页；首页、分类/标签列表、RSS、Algolia 和 sitemap 的公开内容筛选规则保持现状。
- 范围不包含 GIF/SVG 封面展示、无扩展名文章引用、没有 MDX 源文件的自动目录列表、目录推导分类/标签或其他元信息，也不增加文章局部组件目录、目录继承、递归组件命名或组件自动生成页面地址的能力。

## Capabilities

### New Capabilities

- `post-cover-discovery`：显式封面与按文章资源目录发现封面的规则、格式支持、歧义处理，以及统一的数据消费。
- `content-routing`：文章源文件到页面地址的目录映射、目录首页、关于页面定位、路由冲突检测及现有发布行为的约束。
- `mdx-component-discovery`：组件文件到 MDX 标签的目录映射、固定语义绑定、运行时与静态检查的一致性、错误诊断及 SSR 行为。
- `relative-post-links`：Markdown 相对文章引用到页面地址的转换、链接后缀与片段处理、错误诊断和浏览器站内导航。

### Modified Capabilities

无。当前项目尚无已归档的能力规格。

## Impact

- 构建与内容处理：`gatsby-node.ts`、`gatsby-config.ts`、`src/utils/post.ts`，以及 `plugins/` 下的文章链接处理；复用 Gatsby 的文件节点、Schema Customization 和现有 remark 链路。
- 数据与展示：`src/types/global.d.ts`、文章与列表模板、`useAllMdx`、`Post`、侧边栏、SEO、Algolia 搜索记录及 RSS 查询；层级路由与封面结果需要端到端一致。
- MDX 组件：调整六个组件的文件归属与相对导入，新增 `src/mdx/` 下的统一注册入口及链接/图片渲染器，替换模板与 `eslint.config.mjs` 的手写组件名单。组件发现复用 Gatsby 使用的 webpack 目录模块能力，必要的标准环境类型作为开发依赖管理。
- Sitemap：`plugins/sitemap.ts` 当前只按单层 `/posts/<slug>` 识别文章，需支持层级文章和目录首页，同时维持草稿排除规则。
- 文档与验证：更新 `README.md` 和 `AGENTS.md`，为路由、封面和链接解析增加最小回归验证，并执行类型、定向 lint、生产 dry-run 构建和浏览器验证。
- 不预设新增运行时依赖；若补充 webpack 环境类型，维护 `package.json` 与 `pnpm-lock.yaml`。不调整部署、Algolia 权限或生产发布范围。
