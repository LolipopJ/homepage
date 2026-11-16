# relative-post-links Specification

## Purpose

让作者在 Markdown 中使用相对源文件路径引用站内文章，在编辑与构建时共享同一文章关系，减少手写页面 URL 和 JSX 链接。转换后的引用必须遵循内容路由约定，保留查询参数与章节定位，并在目标无效时提供可定位的错误，避免静态站点生成失效引用。

## Requirements

### Requirement: 相对文章引用转换为页面地址

系统 SHALL 将 Markdown 普通链接及引用式链接中指向 `.md` / `.mdx` 的相对路径，转换为目标源文件的页面地址。路径 SHALL 相对于当前 MDX 源文件所在目录解析，支持普通文件名、`./` 和 `../`，并遵循内容路由的目录层级、目录首页及关于页面规则。

#### Scenario: 同目录文章链接

- **WHEN** `blog/posts/guide/start.mdx` 中包含 `[配置](./setup.mdx)` 或 `[配置](setup.mdx)`，且目标文章存在
- **THEN** 两种写法都生成指向 `/posts/guide/setup` 的链接

#### Scenario: 跨目录与目录首页引用

- **WHEN** `blog/posts/react/hooks.mdx` 中包含指向 `../guide/index.md` 的链接，且目标文件存在
- **THEN** 链接指向 `/posts/guide`，不包含 `/index`

#### Scenario: 关于页面引用

- **WHEN** `blog/posts/example.mdx` 中包含指向 `../about-me.mdx` 的链接
- **THEN** 链接指向 `/about-me`

#### Scenario: 引用式链接

- **WHEN** Markdown 通过 `[配置][setup]` 引用定义 `[setup]: ./setup.mdx "配置说明"`
- **THEN** 最终链接使用目标文章页面地址，并保留链接文字和标题

### Requirement: 查询参数与片段语义保持一致

系统 SHALL 保留相对文章链接的查询参数和片段含义；解析文件时 SHALL 仅使用路径部分。已进行 URL 编码的路径段和片段 MUST NOT 被重复编码，未编码的中文或空格也 SHALL 能定位到正确文章和章节。

#### Scenario: 查询参数与章节定位

- **WHEN** 链接为 `./setup.mdx?view=compact#数据备份`，且目标文件和章节存在
- **THEN** 目标页面为对应的 `setup` 文章，查询参数仍为 `view=compact`
- **AND** 浏览器导航能够定位到“数据备份”章节

#### Scenario: 已编码路径与片段

- **WHEN** 相对路径中的中文文件名与片段已经使用有效的百分号编码
- **THEN** 系统解析到真实源文件，最终页面地址与片段不因重复编码而出现额外的 `%25`

### Requirement: 目标必须存在且可以生成页面

相对文章链接指向不存在的文件，或指向不属于文章与关于页面路由范围的 `.md` / `.mdx` 文件时，系统 MUST 终止构建。错误 MUST 包含引用方源文件、原始链接、解析后的目标路径，以及可获得的源位置；系统 MUST NOT 猜测扩展名或替换为其他同名文章。

#### Scenario: 目标文章不存在

- **WHEN** 源文件引用 `./missing.mdx`，且该文件不存在
- **THEN** 构建失败，错误包含引用方、原始链接与目标路径，并在存在位置信息时显示行列

#### Scenario: 目标位于路由范围外

- **WHEN** 相对链接指向仓库中的某个 `.md` 文件，但该文件不属于文章目录或关于页面源文件
- **THEN** 构建失败并说明该目标没有页面路由，不将它作为文章附件下载链接处理

#### Scenario: 引用现有草稿详情页

- **WHEN** 公开文章通过相对文件路径引用 `blog/drafts/` 下存在的文章
- **THEN** 引用被转换为该草稿现有的 `/posts/` 页面地址，生产构建不因其草稿身份拒绝引用
- **AND** 草稿的公开列表与索引筛选规则保持不变

### Requirement: 其他链接与内容不受转换影响

文章源文件转换 SHALL 只作用于 Markdown 的文章链接；转换步骤 MUST 保持外部 URL、协议链接、纯锚点、已有页面 URL、图片和其他附件链接的目标地址与资源处理语义。系统 MUST NOT 改写代码块、行内代码或已有 JSX 链接，也不将无扩展名或目录链接猜测为文章。

#### Scenario: 外部 Markdown 文件

- **WHEN** Markdown 链接指向 `https://example.com/README.md`
- **THEN** 该 URL 不被当作本地文章解析，继续作为外部链接

#### Scenario: 图片、附件与代码示例

- **WHEN** 正文包含相对图片、PDF 附件、代码块中的 `[示例](./missing.mdx)`、纯锚点或 JSX `<Link>`
- **THEN** 这些内容均不被相对文章链接转换修改，图片与附件继续通过既有资源链路处理

#### Scenario: 不猜测目录或扩展名

- **WHEN** Markdown 链接为 `./guide/` 或 `./setup`
- **THEN** 系统不尝试查找 `index.mdx`、`setup.mdx` 或其他可能的文章文件

### Requirement: 转换结果用于站内导航

系统 SHALL 将转换后的站内文章链接渲染为站内导航，不因当前 Markdown 链接的统一处理而强制打开新标签页；章节片段 SHALL 在导航后生效。文章源文件 MUST NOT 因该引用被附件处理链路改写为静态下载地址。

#### Scenario: 普通站内文章导航

- **WHEN** 用户普通点击由相对文章路径生成的链接
- **THEN** 当前页面导航到目标文章，不设置强制打开新标签页的行为
- **AND** 目标地址是文章页面，而不是复制到静态资源目录的 MDX 文件

#### Scenario: 站内章节导航

- **WHEN** 用户点击带章节片段的转换链接
- **THEN** 浏览器打开目标文章并定位章节，查询参数与片段都保留预期含义
