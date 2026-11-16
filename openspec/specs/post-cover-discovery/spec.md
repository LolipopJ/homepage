# post-cover-discovery Specification

## Purpose

让文章通过稳定的资源目录和图片命名约定声明封面，减少正文元数据中重复的图片路径，同时保留显式选择图片的能力。自动发现与显式配置必须在构建、文章展示和搜索中得到一致结果，缺失与歧义也必须有明确行为。

## Requirements

### Requirement: 显式封面优先

系统 SHALL 优先使用 `frontmatter.banner` 中相对于当前 MDX 源文件的显式图片路径。显式配置的文件不存在或格式不受支持时，系统 MUST 报告包含文章与目标路径的构建错误，不改用自动发现的图片。

#### Scenario: 自定义图片覆盖约定封面

- **WHEN** `example.mdx` 配置 `banner: ./example/custom.png`，且同目录中另有 `cover.webp` 和 `banner.jpg`
- **THEN** 文章使用 `custom.png` 作为封面

#### Scenario: 显式路径无效

- **WHEN** 文章显式配置的图片不存在，或指向不受支持的图片格式
- **THEN** 构建失败，错误指出文章源文件、显式路径和失败原因
- **AND** 即使存在可自动发现的封面也不替换该配置

### Requirement: 按文章资源目录发现封面

未提供显式图片路径时，系统 SHALL 在普通文章旁的同名目录查找封面，并在 `index.md` / `index.mdx` 目录首页自身所在的目录查找封面。资源目录 MUST 根据源文件路径确定，不从编码后的页面 URL 推导。

#### Scenario: 普通文章与嵌套文章

- **WHEN** `blog/posts/react/hooks.mdx` 未配置封面，且存在 `blog/posts/react/hooks/cover.png`
- **THEN** 该文章自动使用这张图片

#### Scenario: 目录首页使用同目录资源

- **WHEN** `blog/posts/guide/index.mdx` 未配置封面，且存在 `blog/posts/guide/banner.jpg`
- **THEN** 目录首页自动使用 `guide/banner.jpg`，不查找 `guide/index/` 下的图片

#### Scenario: 中文名称按真实文件目录查找

- **WHEN** `blog/drafts/使用指南.mdx` 未配置封面，且存在 `blog/drafts/使用指南/cover.webp`
- **THEN** 系统使用该真实目录中的图片，页面地址中的 URL 编码不影响资源发现

### Requirement: 自动发现的优先级与图片格式

系统 SHALL 先查找文件基名为 `cover` 的候选，再查找文件基名为 `banner` 的候选，识别的扩展名为 `jpg`、`jpeg`、`png`、`webp`、`avif`、`tif`、`tiff`。只有当前优先级没有候选时，系统 SHALL 检查下一优先级。

#### Scenario: cover 优先于 banner

- **WHEN** 未显式配置封面，且资源目录内同时存在唯一的 `cover.webp` 和 `banner.png`
- **THEN** 系统选择 `cover.webp`

#### Scenario: 支持的格式一致参与发现

- **WHEN** 资源目录内只有一张名为 `banner` 的图片，扩展名属于支持列表
- **THEN** 系统选择该图片，扩展名不引入额外的选择优先级

#### Scenario: 不支持的文件不成为候选

- **WHEN** 未显式配置封面，且资源目录内只有 `cover.gif` 或 `banner.svg`
- **THEN** 这些文件不作为自动封面候选

### Requirement: 歧义必须可诊断

自动发现正在检查的同一优先级存在多张候选图片时，系统 MUST 终止构建，并在错误中列出文章源文件和全部冲突候选；系统 MUST NOT 按扩展名顺序、文件系统枚举顺序或时间选择图片。

#### Scenario: 同名不同格式冲突

- **WHEN** 未显式配置封面，且资源目录内同时存在 `cover.jpg` 和 `cover.png`
- **THEN** 构建失败，错误包含文章源文件以及两张候选图片的路径

#### Scenario: 已确定的高优先级不受低优先级歧义影响

- **WHEN** 未显式配置封面，且资源目录内存在唯一的 `cover.png`，以及 `banner.jpg` 和 `banner.webp`
- **THEN** 系统选择 `cover.png`，不因低优先级的多个 `banner` 候选报错

### Requirement: 无封面文章保持有效

未提供显式图片路径且没有支持的候选图片时，系统 SHALL 将文章作为无封面文章正常构建。所有文章都没有显式封面字段时，封面查询也 MUST 能够执行。

#### Scenario: 资源目录缺失或没有封面

- **WHEN** 未显式配置封面，且文章资源目录不存在或没有支持的 `cover.*` / `banner.*`
- **THEN** 文章正常生成，列表使用现有无封面展示

#### Scenario: 内容不再包含显式 banner

- **WHEN** 全部文章都省略 `frontmatter.banner`，部分文章可自动发现封面
- **THEN** 构建与封面查询成功，自动封面与无封面结果都正确返回

### Requirement: 所有入口共享封面结果

系统 SHALL 让读取文章封面的展示入口、SEO 和构建数据消费相同的解析结果；自动发现的图片 SHALL 与显式指定的同一张图片产生等价的封面数据，不修改文章源文件以补写配置。

#### Scenario: 自动封面贯穿展示与构建数据

- **WHEN** 文章通过约定发现 `cover.png`
- **THEN** 首页、分类/标签列表、侧边栏、搜索记录及搜索卡片使用同一张封面
- **AND** 文章 SEO 图片和 RSS 构建查询读取相同的封面来源，RSS 输出保持既有结构
- **AND** MDX 源文件没有被自动添加或改写 `banner` 字段
