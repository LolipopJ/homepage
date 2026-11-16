# content-routing Specification

## Purpose

让文章源文件的目录结构直接表达页面地址，并通过目录首页组织独立内容，使普通文章和文章资源可以按层级管理。文件到页面的映射必须明确且唯一，所有导航和索引消费同一地址，同时保留项目当前的草稿详情页生成与公开内容筛选行为。

## Requirements

### Requirement: 目录层级映射文章地址

系统 SHALL 将 `blog/posts/` 和 `blog/drafts/` 下的 `.md` / `.mdx` 文件映射到 `/posts/` 下的对应目录地址，去除源文件扩展名并保留目录层级。每个路径段 SHALL 单独进行 URL 编码，目录分隔符保持为 `/`。

#### Scenario: 平铺文章地址

- **WHEN** 构建 `blog/posts/example.mdx`
- **THEN** 文章地址为 `/posts/example`，与当前平铺文章规则一致

#### Scenario: 嵌套文章地址

- **WHEN** 构建 `blog/posts/react/hooks.mdx` 或对应目录中的 `.md` 文章
- **THEN** 文章地址包含 `/posts/react/hooks` 的层级，不生成仅取文件名的 `/posts/hooks` 别名或重定向

#### Scenario: 中文与空格路径

- **WHEN** 源文件的目录或文件名包含中文、空格或需要转义的字符
- **THEN** 地址对各路径段进行一次编码，层级分隔符不被编码为 `%2F`
- **AND** 地址在 Windows 本地与 Linux 构建中一致

### Requirement: index 文件映射目录首页

系统 SHALL 将末尾的 `index.md` / `index.mdx` 映射到父目录地址。目录首页 SHALL 使用该文件自身的正文、frontmatter 和文章模板，不自动生成文章聚合列表；只有目录而没有首页源文件时，系统 MUST NOT 为其自动创建首页。

#### Scenario: 嵌套目录首页

- **WHEN** 存在 `blog/posts/guide/index.mdx`
- **THEN** 该文件对应 `/posts/guide`，页面内容来自这个 MDX 文件

#### Scenario: 内容根目录首页

- **WHEN** 存在 `blog/posts/index.md`
- **THEN** 该文件对应 `/posts`
- **AND** 现有网站首页 `/` 的来源与行为保持不变

#### Scenario: 只折叠末尾 index

- **WHEN** 构建 `blog/posts/guide/index/setup.mdx`
- **THEN** 文章地址为 `/posts/guide/index/setup`，中间的 `index` 目录被保留

#### Scenario: 没有首页文件的目录

- **WHEN** `blog/posts/guide/` 下只有 `setup.mdx`，没有 `index.md` 或 `index.mdx`
- **THEN** 系统仅生成 `/posts/guide/setup`，不自动创建 `/posts/guide`

### Requirement: 关于页面按源文件定位

系统 SHALL 仅将实际的 `blog/about-me.mdx` 映射到 `/about-me`。文章目录中同名的文件 SHALL 遵循普通文章路由规则，不因文件基名相同而覆盖关于页面。

#### Scenario: 关于页面与同名文章共存

- **WHEN** 同时存在 `blog/about-me.mdx` 和 `blog/posts/about-me.mdx`
- **THEN** 两者分别生成 `/about-me` 和 `/posts/about-me`

### Requirement: MDX 路由冲突必须终止构建

多个 MDX 源文件映射到同一页面地址时，系统 MUST 终止构建，并报告规范化后的冲突地址与全部冲突源文件。系统 MUST NOT 按遍历顺序、文件扩展名或公开/草稿身份选取其中一个。

#### Scenario: 普通文章与目录首页冲突

- **WHEN** 同时存在 `blog/posts/guide.mdx` 和 `blog/posts/guide/index.md`
- **THEN** 构建失败，诊断列出 `/posts/guide` 及两个源文件

#### Scenario: 公开文章与草稿冲突

- **WHEN** 公开目录和草稿目录下的文章映射到同一地址
- **THEN** 构建失败，诊断包含两个源文件，不隐式优先公开文章

### Requirement: 页面地址在所有消费入口一致

系统 SHALL 让文章卡片、侧边栏、搜索结果、RSS、SEO、站点地图及站内引用使用同一文件映射得到的页面地址。侧边栏 SHALL 仅选中当前文章，访问子文章时不同时选中目录首页。文章日期与公开属性 SHALL 正确关联到层级地址和根目录首页。

#### Scenario: 嵌套文章的地址与索引

- **WHEN** 公开文章 `blog/posts/guide/setup.mdx` 参与页面、列表、搜索、RSS、SEO 和站点地图生成
- **THEN** 所有入口都指向 `/posts/guide/setup` 对应的页面
- **AND** 站点地图使用该文章的更新时间或发布日期

#### Scenario: 目录首页与子文章的侧边栏选中状态

- **WHEN** 同时存在 `/posts/guide` 和 `/posts/guide/setup`，且用户访问后者
- **THEN** 侧边栏只选中 `setup` 文章，不选中 `guide` 目录首页

#### Scenario: 根目录首页参与构建数据

- **WHEN** `blog/posts/index.mdx` 生成 `/posts`
- **THEN** 列表链接、RSS 标识与 URL、SEO 和站点地图均正确生成，不因首页路径折叠而产生空标识或错误地址

### Requirement: 既有发布范围保持现状

系统 MUST 保持草稿在生产环境生成详情页的现有行为，以及首页、分类/标签列表、RSS、Algolia 和站点地图的既有公开内容筛选规则；层级路径和目录首页 SHALL 遵循同样规则。目录层级 MUST NOT 自动改变分类、标签或发布状态。

#### Scenario: 生产环境中的嵌套草稿

- **WHEN** 生产构建包含 `blog/drafts/guide/setup.mdx`
- **THEN** `/posts/guide/setup` 详情页正常生成
- **AND** 该草稿不进入生产首页、分类/标签列表、RSS、Algolia 或站点地图

#### Scenario: 草稿目录首页

- **WHEN** 生产构建包含 `blog/drafts/guide/index.mdx`
- **THEN** `/posts/guide` 详情页正常生成，并按现有草稿规则排除在公开列表与公开索引之外

#### Scenario: 目录不推导分类或标签

- **WHEN** 文章被放在名为 `react` 的目录中
- **THEN** 分类与标签仍由文章现有元信息决定，系统不自动添加 `react`
