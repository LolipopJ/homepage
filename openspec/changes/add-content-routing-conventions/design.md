# Design

## Context

动机与范围见 [proposal.md](proposal.md)，行为约束分别见四份能力规格。

- `gatsby-node.ts` 目前调用 `parseFilePathToPostSlug`，只对文件基名编码；`createPages` 又根据 slug 是否等于 `about-me` 选择模板地址。
- 文件资源由 `gatsby-source-filesystem` 提供，`posts`、`drafts` 和 `about-me.mdx` 分别配置来源。没有代码消费这些来源的 `sourceInstanceName`。
- 封面目前依赖 `frontmatter.banner` 的自动类型推断。列表、RSS、Algolia 和 SEO 均已消费该字段，继续使用这一查询结构可以避免新增第二套封面数据。
- 安装的 Gatsby 支持自定义字段解析与 `fileByRelativePath` 扩展组合：先取得路径值，再通过文件节点关联封面。已安装的 Sharp 插件支持规格列出的七种扩展名。
- MDX 插件先执行 `mdxOptions.remarkPlugins`，然后追加 `gatsbyRemarkPlugins` 的转换器，因此相对文章链接可在附件复制前处理。
- `src/templates/post.tsx` 显式导入六个自有创作组件和 Gatsby 的 `Link`，构造七个大写名称的映射，再通过 `MDXProvider` 交给正文。`eslint.config.mjs` 的 MDX globals 另外重复列出同样七个名称；只注册其中一处会造成运行时与静态检查不一致。
- 同一模板还内联定义 `ALink`、`FancyBoxImage`，将 Markdown 的 `a`、`img` 接管为链接处理和图片预览。MDX 正文中的这些组件无需逐篇 import；显式导入仍按 MDX 的局部作用域生效。
- 现有 MDX 实际使用了上述七个大写标签。`ProjectGrid` 已不在模板、ESLint 或正文中，只有 `AGENTS.md` 仍声称它是别名，这项文档应纠正，不重建已经不存在的别名。
- `ALink` 当前将所有非纯锚点链接视为外部链接，并丢弃链接标题。布局使用自定义滚动容器、运行时编码的标题 ID，并仅用 hash 判断是否已完成章节定位。
- Sitemap 按单层 `/posts/<slug>` 匹配文章；侧边栏按文章路径前缀匹配选中项。这两个入口都需要适配目录首页。

## Goals / Non-Goals

**Goals:**

- 文件到文章标识、页面地址的计算集中在可被构建端和浏览器复用的纯函数中。
- 封面来源和链接目的地在构建阶段确定，展示层只消费已有数据结构。
- 每一层变更都更新完整调用链，并有独立的最小验证，保持站点可构建。
- 保留 Gatsby SSR、现有图片优化、MDX 组件接口与 Markdown 渲染语义，以及内容公开筛选的工作方式。
- 用同一目录和命名函数派生 MDX 可用名称，新增创作组件只需增加一个组件入口文件。

**Non-Goals:**

- 不建立可配置的路由规则引擎、全局路由服务或第二套文章注册表。
- 不根据文件夹猜测标题、分类、标签、日期，不扫描正文选取“第一张图片”。
- 不增加旧路由别名或兼容字段，不批量整理文章目录，也不把现有 JSX 链接转换成 Markdown。
- 本设计不修改主题、评论、部署权限或站点的全局尾斜杠策略。
- 组件发现只服务当前全局 MDX 作用域，不引入文章局部目录、目录继承、递归命名空间、动态加载策略或组件到页面 URL 的映射。

## Decisions

### 1. 从内容根目录计算路由，URL 逻辑保持为纯函数

在 `src/utils/post.ts` 中替换仅处理基名的实现，提供内容相对路径到内容类型、文章标识和页面地址的确定性计算，以及展示端使用的文章地址函数。构建调用方使用 `node:path.relative` 将源文件转换为相对于 `blog/` 的路径，再交给纯函数；纯函数统一路径分隔符，不导入 Node.js 文件系统或路径模块。

只有 `posts/`、`drafts/` 下的 `.md` / `.mdx` 与实际的 `about-me.mdx` 属于可路由内容。来源决定公开/草稿属性，关于页面按完整相对路径识别。目录首页使用普通文章模板；没有首页文件就没有目录页面。

保留现有 `fields.slug` 数据字段，将其定义为“相对于文章来源根目录、去扩展名、逐段编码的文章标识”，包含目录层级和末尾的 `index`。仅计算页面地址时折叠末尾的 `index`。这样文章标识不会因根目录首页而变为空字符串，RSS 的 `guid` 和 React 列表键也无需特殊值。

| 源文件                        | 文章标识      | 页面地址             | 自动封面目录               |
| ----------------------------- | ------------- | -------------------- | -------------------------- |
| `blog/posts/example.mdx`      | `example`     | `/posts/example`     | `blog/posts/example/`      |
| `blog/posts/react/hooks.mdx`  | `react/hooks` | `/posts/react/hooks` | `blog/posts/react/hooks/`  |
| `blog/posts/guide/index.mdx`  | `guide/index` | `/posts/guide`       | `blog/posts/guide/`        |
| `blog/posts/index.md`         | `index`       | `/posts`             | `blog/posts/`              |
| `blog/drafts/guide/setup.mdx` | `guide/setup` | `/posts/guide/setup` | `blog/drafts/guide/setup/` |
| `blog/about-me.mdx`           | `about-me`    | `/about-me`          | `blog/about-me/`           |

现有平铺文章采用同一算法即可获得原地址，不需要兼容分支。候选方案“直接让目录进入 slug，继续在各处拼接 `/posts/`”无法统一处理末尾 `index` 与根目录首页，因此不采用。

### 2. 页面创建与消费者使用同一地址规则

`onCreateNode` 根据内容源路径生成 `slug`、`isPublic`、`isDraft`。`createPages` 根据同一规则获得页面地址，在创建页面前以规范化地址分组，发现多个 MDX 源文件映射到同一地址即报告全部冲突，不按文章或草稿身份选取。

更新 `Post`、侧边栏、RSS 的 URL 构造以及其他拼接文章地址的位置，统一调用文章地址函数。侧边栏对去除尾斜杠后的当前路径进行精确匹配，不再用 slug 插入正则或匹配父路径前缀。文章页面识别包含 `/posts` 目录首页及其子路径。

Sitemap 查询增加实际源文件路径，用同一路由计算建立“完整页面地址到 MDX 元数据”的映射，替换单段路径正则和按 slug 查找元数据的方式。已有的尾斜杠规范化继续复用。由此根目录首页、嵌套文章和同名关于页面都能关联正确日期，并按既有规则排除草稿。

RSS `guid` 仍使用文章标识，页面链接使用页面地址；目录首页的标识保留 `index`，不产生空 GUID。Algolia 继续存储既有字段，搜索卡片通过共享的 `Post` 获得正确地址，不新增冗余路径字段。

### 3. 复用文件节点和现有 banner 查询

将 `gatsby-config.ts` 中三个博客来源收敛为一个 `blog/` 文件系统来源，保留 `src/pages/` 来源。路由仍仅接受决策 1 中的内容路径，其余博客文件可作为资源。这样 `blog/about-me/` 等实际存在的资源目录也会产生文件节点，无需临时复制图片或为每种文章布局增加来源。

在 `plugins/post-cover.ts` 中分离资源目录计算、候选选择和 Gatsby 字段适配；通过 `createSchemaCustomization` 显式声明可空的 `MdxFrontmatter.banner: File`。字段先根据原始 frontmatter 和来源 File 节点计算选择结果，再复用 `fileByRelativePath` 扩展建立图片关联，不修改 Mdx 节点或补写 MDX 内容。

候选来自 Gatsby 的 File 节点查询，使用框架的节点查询和依赖记录；不维护模块级文件扫描缓存。显式路径只接受支持的图片文件，验证失败直接报错。未提供路径（省略或 YAML 空值）时才自动发现，基名严格使用小写 `cover` / `banner`，扩展名使用规格中的小写列表。同一优先级的多个候选报错；已经选中高优先级结果后不再检查低优先级歧义。

现有 `frontmatter.banner` 查询、`MdxNode` 封面结果类型和 `GatsbyImage` 消费结构继续使用；核对所有查询与消费入口，不为自动封面新增平行字段。显式 schema 保证全站没有 `banner` 元数据时查询仍成立。

候选方案“在 React 中扫描或选择封面”无法让 SEO、RSS 和搜索构建共享结果；“直接改写 frontmatter 节点”会依赖 Gatsby 节点变更与推断时序；“新增独立封面字段”会增加重复数据与调用方改动，因此均不采用。

### 4. 由专用组件目录派生运行时注册与静态检查

六个自有创作组件的实现移入 `src/components/mdx/`，保留 `card.tsx`、`game-card.tsx`、`game-platform-card.tsx`、`grid.tsx`、`hint-text.tsx`、`project-card.tsx` 文件名，并更新全部调用方和组件内部的 hooks、Icon 等相对导入。旧位置直接删除，不留下转导出文件。普通站点组件仍留在 `src/components/`，不会全部暴露给文章。

入口仅为约定目录顶层的 `.tsx` 文件，要求默认导出组件。`src/utils/mdx-components.ts` 提供可在浏览器和 Node.js 复用的纯命名与入口校验逻辑：规范化相对文件名、检查小写字母/数字组成的 kebab-case、转换 PascalCase、稳定排序，并检查固定名称冲突。其他扩展名与子目录不参与自动发现；顶层 `.tsx` 文件名不合规则报错，不静默忽略。React 函数内部名称及压缩结果不参与命名。

新建 `src/mdx/components.ts` 作为实际注册入口，使用 Gatsby 所用 webpack 的同步 `require.context` 收集该目录，递归参数为 `false`。目录、递归参数和匹配规则使用 webpack 可静态分析的字面量，文件名交由共享纯函数转换；默认导出缺失时抛出包含入口与预期名称的错误。最终对象按 `MDXProvider` 的组件类型组织，不增加自定义 React 组件类型识别器。标准环境类型由 `@types/webpack-env` 开发依赖提供，维护 `package.json` 与锁文件，不在源码中复制 webpack API 声明。

把模板内的 `ALink`、`FancyBoxImage` 实现分别移到 `src/mdx/a.tsx` 和 `src/mdx/img.tsx`，原有行为先随职责移动，再在相对链接阶段修改。统一注册入口显式绑定 `a`、`img` 和 Gatsby `Link`，并合并约定目录中的六个自有组件。固定名称集合和命名校验在纯函数模块维护，自动入口不得覆盖；`link.tsx` 会与固定 `Link` 冲突。固定绑定不是新的兼容别名。

模板只导入统一映射并保留原来的 `MDXProvider` 包裹位置，不将组件作用域上移到整个 Gatsby 应用。已有 `Card`、`Link`、`HintText`、`GameCard`、`GamePlatformCard`、`Grid`、`ProjectCard` 名称和 props 不变。MDX 的局部 import、定义、图片和图标表达式继续由编译器处理；本功能不改写正文。[MDX 的组件作用域说明](https://mdxjs.com/docs/using-mdx/)

ESLint 使用 Node.js 文件系统读取同一目录顶层的文件名，调用同一个纯函数，并将发现的大写名称和固定 `Link` 转为只读 globals。它不加载 TSX、React、Gatsby 或 webpack 注册模块，因此无需先运行开发服务器或生产构建。`eslint.config.mjs` 在 Node.js 24 中可以直接导入这个不依赖其他运行时模块的纯 TypeScript 文件，移除原有七项手写组件名单。

运行时依赖收集交给 webpack，开发环境新增、删除、重命名入口由目录依赖触发重新编译；ESLint 每次独立调用从当前文件集合计算名称。同步加载让 SSR 和浏览器在首次渲染前拥有同一组组件，也保留当前组件的加载方式。[webpack 目录模块文档](https://webpack.js.org/guides/dependency-management/#requirecontext)

候选方案“只抽出手写 barrel 或注册表”仍要求新增组件时维护导出清单；“扫描全部共享组件”会把应用内部组件暴露给正文；“生成注册代码与额外 watcher”需要增加构建和 lint 前置步骤。当前目录较小，使用现有打包器能力与共享命名规则即可完整满足需求。

### 5. 在 remark 阶段解析相对文章引用

新增 `plugins/remark-relative-post-links.ts`，注册到现有 `mdxOptions.remarkPlugins`，先于 Gatsby 的图片与附件转换执行。直接使用现有 MDX/remark AST 和类型能力，不增加独立 Markdown 解析器或插件注册框架。

转换器处理普通 `link` 和被 `linkReference` 使用的定义，保留链接子节点与标题；只对无协议、非根路径、非纯锚点，且路径部分以 `.md` / `.mdx` 结尾的目标执行文章解析。引用式链接按其实际用途处理，图片引用和无关定义不受文章链接转换影响。

先分离 pathname、query、fragment，仅对 pathname 做一次有效 URL 解码，再相对于当前源文件解析真实目标。检查文件存在且属于可路由来源后调用共享路由函数，附回原始查询参数和片段。不存在、编码无效或不可路由的目标使用 VFile 错误报告，包含引用方、原始链接、目标和可用行列，不枚举可能的扩展名。

已有页面 URL、附件、图片、代码和 JSX 不经过文章源文件解析。转换后的目的地址以 `/posts` 或 `/about-me` 开头，附件复制阶段得到的是页面链接，不再将这些文章引用转换成静态文件下载。

候选方案“在浏览器中改写 `.mdx` 字符串”不知道当前文章的源目录，也不能在构建时诊断错误；“增加第二次 Markdown 解析”重复已有链路，因此不采用。

### 6. 渲染层统一站内文章导航和章节定位

在上一层已经抽出的 `src/mdx/a.tsx` 中，`ALink` 对 `/posts` 路径族与 `/about-me` 的页面链接使用现有 Gatsby `Link`；其他 URL 与附件保持各自的普通链接处理。补充传递链接标题等既有锚点属性，不让自动转换的文章链接被默认 `_blank` 行为打开。

共享片段编码规则：未编码的片段编码一次，已编码的片段先解码再按相同规则编码，不将 `%` 再次编码。构建转换保留片段，展示与布局将其映射到当前 `encodeURIComponent(heading.innerText)` 标题 ID。不在本变更中重建标题 slug 系统。

布局将“已处理锚点”的身份从单独 hash 改为页面路径与 hash 的组合，在目标文章标题挂载完成后复用现有滚动容器和标题定位机制。相同章节名跨文章导航也必须重新定位；这一点用浏览器检查，不能只检查链接字符串。

### 7. 保持原有公开内容筛选

路由计算独立于发布筛选：所有现有文章、草稿与关于页面仍进入详情页生成。`useAllMdx` 继续仅查询 `isPublic: true`；分类/标签详情列表继续使用现有环境条件；RSS 和 Algolia 继续只选择公开目录内容；Sitemap 继续排除草稿。

不以目录深度或 `index` 身份改变公开属性，也不因公开文章引用草稿而拒绝生成链接。来源收敛为 `blog/` 不意味着扩大页面或公开索引范围。

### 8. 分层实现与最小验证

实现顺序为：路由纯函数与所有地址消费、封面字段解析、MDX 组件发现与渲染器归属调整、相对链接转换与章节导航。组件注册完成后，链接行为直接在统一渲染入口上增加，不重复抽取模板代码。每层先用代表性输入验证，再组合生产构建，避免并行改造出多套未接通的行为。

新增一个 `tests/content-conventions.test.mjs`，沿用现有 Node.js `--test` 与直接导入纯 TypeScript 函数的模式，聚焦目录/index/编码映射、同路由冲突、封面选择歧义和文章链接路径/后缀解析。只为容易在静态构建中无声出错的规则增加断言，不引入测试框架或通用 Gatsby mock 环境。

组件命名与入口校验使用独立的 `tests/mdx-components.test.mjs` 做最小断言，覆盖 PascalCase 映射、目录边界、非法文件名、缺少默认导出和固定名称冲突。使用只读 ESLint 输入验证已注册、未注册和局部导入的名称，不为验证而执行 TSX 模块或启动另一套 Markdown 编译器。

使用最少的临时内容验证真实 GraphQL/MDX 链路：嵌套文章、根与嵌套目录首页、中文片段、普通及引用式相对链接、自动封面、无封面、嵌套草稿和新增自动组件。通过 `pnpm build:dry-run` 后检查页面、RSS、sitemap 和搜索查询/记录，并核对现有七个 MDX 标签均能 SSR；`pnpm serve` 中验证站内点击、同名章节跨文章定位、侧边栏、封面、图片预览和组件交互，验收后清除临时内容。开发时增删一个入口并刷新页面，验证不改模板即可更新组件集合。对歧义图片、路由冲突和失效引用使用单元断言验证错误，避免反复运行全量构建。

执行受影响文件的 ESLint/Prettier 检查与 `pnpm typecheck`。主题入口与样式未改动时，不额外扩大到主题测试或全仓自动修复。文档更新集中在 `README.md` 和 `AGENTS.md` 的内容、路由与组件约定，删除手动同步模板/globals 及 `ProjectGrid` 别名的过时说明。

## Risks / Trade-offs

- [URL 分隔符被整串编码或中文路径被重复编码]：只对源路径段编码一次，URL 与文件系统路径分开处理；覆盖 Windows 分隔符、中文、空格和百分号输入。
- [目录首页与同名文章静默覆盖]：在创建 MDX 页面前按规范化地址检查全部冲突，并在诊断中列出源文件。
- [自动封面在没有显式字段或开发新增图片时失效]：显式声明可空 File 字段，查询 Gatsby 文件节点并使用其依赖记录；开发时增加、删除候选图片均纳入验收。
- [运行时注册与 ESLint 识别产生偏差]：两端只读取同一目录顶层 `.tsx` 文件，并共用名称转换、固定名称集合和冲突校验；在未运行 Gatsby 的环境直接验证 lint。
- [同步组件发现扩大文章共享包]：当前六个组件本已统一加载；约定目录只放全局复用的创作组件，一次性组件仍可由单篇 MDX 显式导入，不在本次增加按需加载机制。
- [组件搬移影响导入或 SSR]：更新全部调用方与组件内部相对路径，保留现有浏览器 API 的 effect、事件和渲染保护；以类型检查、SSR 构建和浏览器交互核对，不保留旧路径转导出。
- [文章引用被附件插件改写]：转换器运行在 `mdxOptions.remarkPlugins`，构建结果中验证普通和引用式链接都是页面地址。
- [URL 正确但章节滚动未执行]：将路径纳入已处理锚点身份，等待现有标题观察机制产生目标 ID，再在实际滚动容器中定位。
- [层级草稿误入公开索引]：完整路径关联源元数据，单独验证草稿详情页可访问而公开列表、RSS、Algolia 和 Sitemap 排除它的既有行为。
