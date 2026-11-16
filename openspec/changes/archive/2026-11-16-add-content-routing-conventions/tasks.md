# Tasks

## 1. 内容路由与目录首页

- [x] 1.1 在 `tests/content-conventions.test.mjs` 中补充路由规则的最小断言，覆盖平铺/嵌套文章、普通/根目录首页、中文与空格、Windows 分隔符、关于页面和同名普通文章；用 `node --test tests/content-conventions.test.mjs` 确认断言可复现旧规则的不足。
- [x] 1.2 替换 `src/utils/post.ts` 的基名路由逻辑，提供共享的内容类型、文章标识和地址计算；标识保留末尾 `index`，页面地址才折叠它。通过 1.1 的断言验证输出，并确认浏览器可用的工具函数不导入 Node.js 模块。
- [x] 1.3 在 `gatsby-node.ts` 中接入源路径分类与共享路由规则，创建页面前检查全部 MDX 地址冲突；增加同名普通文章/目录首页、公开文章/草稿冲突的最小断言，验证错误列出地址与全部源文件，且草稿生产详情页逻辑未改变。
- [x] 1.4 更新 `Post`、RSS URL、侧边栏与文章页面识别等路由消费处，目录首页也使用共享地址函数；对规范化路径精确匹配侧边栏选中项。通过定向 ESLint、`pnpm typecheck` 和调用方检索，确认没有遗留基名路径拼接与父路径正则匹配。
- [x] 1.5 更新 `gatsby-node.ts` 的 sitemap 查询及 `plugins/sitemap.ts`，按实际源文件生成完整路径映射；补充嵌套文章、目录首页及草稿排除的最小断言，验证更新日期关联正确且不依赖单层文章路径正则。
- [x] 1.6 更新 `README.md` 和 `AGENTS.md` 中的文章路由、目录首页与 slug 说明，列出平铺、嵌套、根目录首页和冲突示例；对文档执行定向 Prettier 检查并核对示例与 1.1 的预期一致。

## 2. 封面自动发现

- [x] 2.1 在现有新增的 Node 测试文件中加入封面选择断言，覆盖显式覆盖、无效显式路径、普通文章/目录首页资源目录、支持格式、cover 优先、同级冲突、低优先级歧义和无封面；确认断言对应封面规格中的可观察结果，不引入 Gatsby 通用 mock 环境。
- [x] 2.2 将博客文件系统来源收敛为 `blog/`，保留页面来源和明确的可路由范围；检查所有来源名消费为零，核对既有公开筛选表达式未扩大到其他博客文件，并确认关于页面旁的资源可以成为 File 节点。
- [x] 2.3 在 `plugins/post-cover.ts` 实现资源目录与候选选择，并在 `gatsby-node.ts` 显式声明可空封面字段，复用文件节点查询与 `fileByRelativePath`；通过 2.1 断言、定向 ESLint 和 `pnpm typecheck` 验证，不修改 Mdx 节点或 MDX 源文件。
- [x] 2.4 核对首页、列表、侧边栏、搜索记录、RSS 和 SEO 对 `frontmatter.banner` 的查询与消费，保留统一字段与既有 RSS 输出结构；更新 `README.md`、`AGENTS.md` 的封面目录、优先级、格式和错误示例，定向格式检查通过，查询核对结果进入交付记录。

## 3. MDX 组件目录发现

- [x] 3.1 先在 `tests/mdx-components.test.mjs` 补充最小断言，再在 `src/utils/mdx-components.ts` 实现共享命名与入口校验；覆盖顶层 `.tsx` 范围、kebab-case 到 PascalCase、非法名称、稳定排序、默认导出缺失及固定名称冲突，通过 `node --test tests/mdx-components.test.mjs` 验证，不引入 TSX 执行器或 Gatsby mock 环境。
- [x] 3.2 将六个自有创作组件移入 `src/components/mdx/`，将模板内的链接和图片实现移到 `src/mdx/a.tsx`、`src/mdx/img.tsx`，更新所有调用方及 hooks、Icon 相对导入；旧文件不留转导出，组件 props 与现有渲染行为保持原样，定向 ESLint 和 `pnpm typecheck` 通过。
- [x] 3.3 新增 `src/mdx/components.ts`，使用同步、非递归的 webpack 目录模块收集默认导出，复用 3.1 的命名规则并组合固定 `Link`、`a`、`img`；模板只消费统一映射，补充标准 `@types/webpack-env` 开发依赖并维护锁文件，通过命名/导出断言与 `pnpm typecheck`，核对七个既有公开标签及全部 props 保留。
- [x] 3.4 将 `eslint.config.mjs` 的 MDX 组件 globals 改为从同一目录与共享命名函数派生，移除七项手写名单，不加载运行时 TSX 或 Gatsby 注册模块；在未启动 Gatsby 的独立 ESLint 调用中验证新增组件可识别、删除后的残留引用报未定义、局部导入可覆盖同名全局组件，名称冲突也有明确错误。
- [x] 3.5 更新 `README.md`、`AGENTS.md` 的 MDX 可用组件与目录约定，说明默认导出、命名、固定绑定、非递归范围和局部 import，并删除手动同步模板/globals 与 `ProjectGrid` 别名的过时说明；定向 Prettier 检查通过，示例与组件发现规格一致。

## 4. 相对文章链接与章节导航

- [x] 4.1 在 `tests/content-conventions.test.mjs` 中补充目标路径和链接后缀解析的最小断言，覆盖普通文件名、`./`、`../`、编码路径、query/hash 保留、无效编码、缺失/不可路由目标以及不应转换的 URL；用现有 Node 测试命令验证规则。
- [x] 4.2 新增 `plugins/remark-relative-post-links.ts` 并注册到 `mdxOptions.remarkPlugins`，支持普通链接和引用式链接、保留标题与文字，使用共享路由计算并提供 VFile 位置错误；通过断言和定向 ESLint 验证，确认执行顺序早于附件复制且不修改图片引用、代码或 JSX。
- [x] 4.3 调整 3.2 已抽出的 `src/mdx/a.tsx`，让站内文章地址使用 Gatsby `Link`，传递标题等锚点属性，保持外部 URL 与附件语义；定向 ESLint 与 `pnpm typecheck` 通过，代码检查确认自动文章链接不再强制 `_blank`，不重新在文章模板内定义渲染器。
- [x] 4.4 统一片段的一次编码规则，并在 `src/layouts/index.tsx` 以页面路径与 hash 共同标识已处理章节，复用既有标题观察与滚动机制；增加原始/已编码片段和跨页面同 hash 的最小断言，并通过定向 ESLint、`pnpm typecheck`。
- [x] 4.5 在 `README.md` 和 `AGENTS.md` 中补充相对文章链接、引用式链接、目录首页链接、query/hash 与错误行为的示例，说明不猜测目录或扩展名；定向 Prettier 检查通过，示例与链接规格和解析断言一致。

## 5. 端到端验收

- [x] 5.1 用最少的临时内容运行 `pnpm build:dry-run`，覆盖嵌套文章、根/嵌套目录首页、中文章节、普通/引用式链接、自动/无封面、嵌套草稿与新增自动组件，并验证现有七个 MDX 标签的 SSR；检查页面、SEO、RSS、sitemap 及 Algolia 查询/记录，确认没有写入 Algolia，草稿详情页与公开筛选保持现状。
- [x] 5.2 通过 `pnpm serve` 在浏览器验证封面、站内当前页导航、中文章节定位、相同 hash 跨文章定位、目录首页和子文章的侧边栏选中状态，以及组件 props/交互、图片预览、附件和外部 URL；记录真实结果，确认无组件注册导致的 hydration 错误，不以字符串断言代替交互验收。
- [x] 5.3 在开发服务器中增加、删除及替换约定封面候选，并增删或重命名一个合法 MDX 组件入口；验证封面与组件集合在重新编译及刷新后反映文件变化，不需要手改模板或重启服务器，缺少封面候选时恢复无封面、同级多候选时报出明确错误；记录结果并清除临时内容。
- [x] 5.4 检查最终 diff 只包含任务相关变更，确认旧路由算法、重复地址拼接和模板/ESLint 手写创作组件名单已移除，无兼容别名、旧路径转导出或临时内容，全部实施任务的定向检查已完成；按 `caveman-commit` 生成提交信息，并如实记录未能执行的验收项。
