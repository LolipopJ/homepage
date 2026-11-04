# AGENTS.md

`homepage` 是 Lolipop 的个人主页与博客，使用 Gatsby 5、React 18、TypeScript 和 Tailwind CSS 4，文章由 MDX 编写，构建为静态站点并部署到 GitHub Pages。本文件适用于整个仓库。

修改构建、内容处理或路由前，先读 [gatsby-config.ts](gatsby-config.ts) 和 [gatsby-node.ts](gatsby-node.ts)。命令与环境要求以 [package.json](package.json) 和 [部署工作流](.github/workflows/deployment.yml) 为准。

## 开发原则

- 选择完整满足当前需求的最简单实现，不增加推测性的抽象、配置或间接层。
- 从可运行的最小版本逐层扩展，每一层保持端到端可用，避免用未完成的重构替换现有功能。
- 不保留向后兼容路径。行为或接口变更时更新所有调用方，删除过时代码，不增加兼容层、回退实现或迁移机制。
- 保持职责分离：构建与节点处理放在 Gatsby 入口或 `plugins/`，页面放在 `pages/`、`templates/`，共享展示放在 `components/`，交互逻辑放在 `hooks/`，独立计算放在 `utils/`。
- 优先使用项目已有依赖，确认文档和类型声明后再判断能力是否缺失。成熟且维护良好的库能减少总体复杂度时，优先采用，避免重写常见功能。
- 为长期维护做决定，避免引入计划以后替换的临时方案。变更范围限于当前任务，保留用户已有的修改。

## 目录与入口

```text
gatsby-config.ts         站点元数据、内容源、MDX、图片、RSS、Algolia
gatsby-node.ts           MDX 字段、文章及分类/标签路由、Webpack 配置
gatsby-browser.js        全局样式、ThemeProvider、路由进度条
gatsby-ssr.js            SSR ThemeProvider、首屏主题脚本和 theme-color
src/pages/               首页、分类/标签索引、404 等文件路由
src/templates/           文章详情和文章列表模板
src/layouts/             全局布局、导航栏、侧边栏
src/components/          共享组件、文章渲染、搜索和评论
src/hooks/               数据查询、主题、Mermaid 等交互逻辑
src/utils/               文章 slug 和主题初始化等工具
src/constants/           导航、分类、搜索和第三方服务配置
src/types/               全局数据类型与样式声明
src/styles/              全局样式、主题变量、文章及第三方组件样式
plugins/                 自定义 remark 和 PostCSS 插件
blog/posts/              已公开文章及配套资源
blog/drafts/             草稿及配套资源
blog/about-me.mdx        关于页面内容
blog/posts/about-me/     关于页面图片
static/                  原样复制到站点根目录的静态资源及验证文件
tests/theme.test.mjs     主题初始化和第三方 CSS 作用域回归测试
.github/workflows/       构建和部署流程
```

`public/`、`.cache/`、`node_modules/` 和 `src/gatsby-types.d.ts` 是被忽略的产物，不手动修改或提交。`pnpm-workspace.yaml` 管理依赖构建许可和 overrides，修改依赖时同时维护 `package.json` 与 `pnpm-lock.yaml`。

## 环境与命令

使用 Node.js **≥24**、pnpm **≥12**。CI 使用 Node.js 24 和 pnpm 12。

| 命令                                 | 用途                                           |
| ------------------------------------ | ---------------------------------------------- |
| `pnpm install`                       | 安装依赖                                       |
| `pnpm install --frozen-lockfile`     | 按锁文件安装，与 CI 一致                       |
| `pnpm develop` / `pnpm start`        | 启动 Gatsby 开发服务器                         |
| `pnpm build`                         | 生产构建；默认会同步 Algolia 索引，见下文      |
| `pnpm serve`                         | 预览已经生成的生产站点                         |
| `pnpm clean`                         | 清理 Gatsby 缓存和构建产物，按需使用           |
| `pnpm typecheck`                     | 执行 `tsc --noEmit`                            |
| `node --test tests/theme.test.mjs`   | 运行现有主题回归测试                           |
| `pnpm exec prettier --check <files>` | 对指定文件做只读格式检查                       |
| `pnpm exec eslint <files>`           | 对指定代码文件做只读 ESLint 检查               |
| `pnpm lint`                          | 对整个项目运行 Prettier 写入和 ESLint 自动修复 |

`pnpm prettier` 和 `pnpm eslint` 也会修改文件。优先检查本次修改涉及的文件；需要修复时使用 `pnpm exec prettier --write <files>` 或 `pnpm exec eslint --fix <files>`，随后检查 diff，避免混入全仓格式变更。

`.husky/pre-commit` 通过 `npm run lint-staged` 修复暂存文件；该钩子不代替类型检查和生产构建。仓库没有 `test` 脚本，使用上表的 Node.js 测试命令。

## 文章、路由与数据

- 公开文章放在 `blog/posts/<name>.mdx`，资源通常放在同名目录，通过相对路径引用；草稿放在 `blog/drafts/`。保留 `static/` 中的站点验证文件与其他现有资源。
- 发布文章填写 `title`、有效日期 `date` 和 `updated`，分类与标签使用字符串数组。`banner` 为可选的相对图片路径。RSS 会对 `updated` 调用 `toISOString()`，不能填写无法解析的日期。
- `timeliness` 从最后更新时间计算：默认阈值为 365 天，`0` 始终显示时效提醒，负数关闭提醒。字段定义见 [global.d.ts](src/types/global.d.ts)。
- slug 由 [parseFilePathToPostSlug](src/utils/post.ts) 对文件名去扩展名后进行 URL 编码得到，不读取 frontmatter 中的 slug。不同目录下的同名文章会使用同一路径，新增或重命名时检查冲突并更新引用。
- 文章路径为 `/posts/<slug>`，关于页面为 `/about-me`，分类与标签列表分别为 `/categories/<category>`、`/tags/<tag>`。页面由 `gatsby-node.ts` 创建，模板通过 `?__contentFilePath=` 加载 MDX 正文。
- **草稿不是私密内容。** 当前生产构建仍为草稿创建详情页；生产分类/标签列表、首页查询、RSS 和 Algolia 的公开内容筛选各自位于 `gatsby-node.ts`、[useAllMdx.ts](src/hooks/useAllMdx.ts) 和 `gatsby-config.ts`。调整发布规则时一并核对这些入口。
- 修改文章字段时，同步维护 `MdxNode` 类型以及使用该字段的页面、列表、RSS 和 Algolia GraphQL 查询。搜索记录类型 `AlgoliaPostItem` 定义在 [algolia-search.tsx](src/components/algolia-search.tsx)，供构建配置复用。
- [文章模板](src/templates/post.tsx) 注册了 `Card`、`Link`、`HintText`、`GameCard`、`GamePlatformCard`、`Grid`、`ProjectCard`，并接管链接与图片渲染。`Grid` 是通用的 24 份网格，`ProjectGrid` 保留为其别名。新增无需显式导入的 MDX 组件时，同步更新模板映射与 `eslint.config.mjs` 中的 MDX globals。
- Mermaid 代码块由 [remark 插件](plugins/remark-skip-code-block.ts) 跳过 Prism 高亮，再由 [useMermaid](src/hooks/useMermaid.ts) 在浏览器加载、渲染。修改代码块处理时保持这两个阶段配合。

## React、主题与样式

- 保持 Gatsby SSR 可执行。浏览器 API 放在 effect、事件处理或明确的客户端调用路径中，避免模块加载或服务端渲染期间直接访问 `window`、`document`、`localStorage`。
- 浏览器与 SSR 入口必须使用一致的 `ThemeProvider`。`gatsby-ssr.js` 在 React 启动前注入 `getThemeScript()`，React 首次渲染与 SSR 保持一致，避免主题闪烁或 hydration 不匹配。
- 主题偏好为 `system | light | dark`，实际主题为 `light | dark`；存储键、解析和首屏脚本由 [theme.ts](src/utils/theme.ts) 统一维护。组件通过 [useTheme](src/hooks/useTheme.ts) 使用主题，不另建存储键或主题状态。
- 样式以根元素的 `data-theme` 和语义 CSS 变量为准。颜色变量放在 [theme.css](src/styles/theme.css)，文章亮暗主题配色放在 [theme-content.css](src/styles/theme-content.css)，Tailwind 主题映射放在 [global.css](src/styles/global.css) 的 `@theme` 中。`src/styles/` 中能用工具类表达的声明统一用 `@apply`，组件布局和交互样式放在组件的 `className` 中。
- Prism 与 Gitalk 的明暗样式由 [postcss-theme-scope.cjs](plugins/postcss-theme-scope.cjs) 按来源文件限定作用域。PostCSS 先展开第三方导入并限定作用域，再运行 Tailwind。
- Tailwind 通过 `@source` 扫描 `blog/**/*.mdx` 和指定的 `src/` 目录。`Grid` 的子组件可通过 `className` 使用 `col-span-1` 至 `col-span-24` 设置列宽。
- 交互组件沿用现有 React、Motion、Tailwind 和 CSS 变量体系。effect 中创建的监听器、定时器和第三方实例由对应 effect 清理。

## 密钥、构建与部署

[gatsby-config.ts](gatsby-config.ts) 使用 dotenv 加载根目录的 `.env` 与 `.env.${NODE_ENV}`。不得提交凭据；当前 `.gitignore` 忽略 `.env.*`，但没有忽略 `.env` 本身，暂存前检查文件列表。

`ALGOLIA_API_KEY` 是构建时使用的索引写入密钥，不放入浏览器代码或 `src/constants/`。浏览器搜索配置位于 `src/constants/algolia.ts`，修改时区分搜索权限和索引写入权限。

**普通 `pnpm build` 会尝试更新 Algolia 索引。** 本地验证设置 `ALGOLIA_DRY_RUN` 为字符串 `true`，执行完后恢复环境设置。PowerShell 示例：

```powershell
$env:ALGOLIA_DRY_RUN = "true"
pnpm build
```

POSIX shell 可使用 `ALGOLIA_DRY_RUN=true pnpm build`。不要为了通过本地验证修改线上索引配置、关闭失败报告或把写入密钥写入源码。

[部署工作流](.github/workflows/deployment.yml) 在 `main` 分支收到 push 时安装依赖、执行 `pnpm build`，使用 `ALGOLIA_API_KEY` 更新索引，再用 `PERSONAL_ACCESS_TOKEN` 将 `public/` 发布到 `LolipopJ/LolipopJ.github.io` 的 `main` 分支。CI 当前只执行安装和构建，其他检查需要按变更范围在本地运行。

## 验证与交付

按本次变更选择检查，不默认运行无关的全量检查，也不在没有新变更或失败证据时重复已通过的检查。

| 变更范围                           | 需要的验证                                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| 文档                               | 指定文件的 Prettier 检查，核对引用路径、命令和描述                                                |
| TypeScript / React                 | 指定代码文件的 ESLint 检查、`pnpm typecheck`；用户可见交互在浏览器验证                            |
| 主题解析、首屏脚本、第三方主题 CSS | 现有主题回归测试；浏览器检查系统主题、显式偏好和刷新后的首屏效果                                  |
| MDX、GraphQL、路由、构建插件或依赖 | 设置 `ALGOLIA_DRY_RUN=true` 后生产构建；按影响范围用 `pnpm serve` 检查文章、分类/标签、资源与 RSS |
| Algolia 查询或搜索记录             | 核对构建查询、记录类型与浏览器搜索消费字段；本地构建保持 dry run                                  |

- 不为机械修改或低风险可逆改动新增测试。仅在复现实际回归或保护容易无声破坏的行为时增加最小测试，优先复用现有 Node.js 测试入口。
- TypeScript 使用 `strict: true`。复用现有类型和库类型，避免用 `any`、无依据的类型断言或重复运行时防御掩盖数据问题；外部输入在实际读取处按需校验。
- ESLint 使用 flat config，启用导入排序、React Hooks、Prettier 和 `eslint-plugin-better-tailwindcss` 规则。Tailwind 规则覆盖组件类名、MDX 类名和 CSS 中的 `@apply`。保持现有文件命名及模块格式；不要全局关闭规则来绕过局部问题。
- 注释解释不明显的用途、限制与资源归属，不复述代码或保留工作过程。行为、命令或目录变化时同步更新相关 README 与本文件。
- 交付时说明修改内容、实际运行的检查及结果；未运行或受环境限制的检查如实说明，不把未执行当作通过。
- 检查 diff 只包含任务相关变更，文件以一个换行符结尾。每次编码任务完成后，使用 `caveman-commit` skill 生成 Conventional Commit 提交信息。
