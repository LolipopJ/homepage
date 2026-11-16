# mdx-component-discovery Specification

## Purpose

让可复用的 MDX 创作组件通过专用目录和稳定的文件命名自动进入文章组件作用域，减少模板注册与静态检查名单之间的重复维护。组件在构建、浏览器和 MDX 检查中必须使用一致的名称，并保留已有标签、Markdown 链接和图片语义以及显式导入的原生作用域。

## Requirements

### Requirement: 专用目录决定可用组件

系统 SHALL 仅将 `src/components/mdx/` 顶层的 `.tsx` 文件作为自动注册入口，要求每个入口默认导出一个 React 组件。目录外组件、嵌套目录文件和其他扩展名 MUST NOT 因扫描而自动成为 MDX 全局组件。组件文件自身不生成页面地址。

#### Scenario: 新增可复用组件

- **WHEN** 作者新增 `src/components/mdx/notice-box.tsx` 并默认导出组件
- **THEN** 受文章模板渲染的 MDX 可以直接使用 `<NoticeBox />`
- **AND** 不需要修改模板中的导入、组件映射或手写的 ESLint 组件名单

#### Scenario: 辅助代码与普通站点组件

- **WHEN** 存在 `src/components/icon.tsx`、`src/components/mdx/helpers.ts` 或 `src/components/mdx/internal/preview.tsx`
- **THEN** 这些文件不被自动注册为 MDX 全局组件

### Requirement: 文件名稳定映射组件标签

系统 SHALL 以不含扩展名的 kebab-case 文件名生成 PascalCase 标签；文件名必须以小写英文字母开头，各段只包含小写字母或数字，并使用单个连字符分隔。映射 MUST 由文件名决定，不依赖函数名、默认导出的内部标识符、文件枚举顺序或生产压缩结果。

#### Scenario: 多单词文件名

- **WHEN** 入口文件为 `game-platform-card.tsx`
- **THEN** 注册名为 `GamePlatformCard`，默认导出的内部函数名称不影响标签名称

#### Scenario: 不符合命名约定

- **WHEN** 顶层入口文件使用 `GameCard.tsx`、`game_card.tsx` 或其他不符合约定的名称
- **THEN** 系统报告包含文件路径与命名要求的错误，不静默忽略或猜测名称

### Requirement: 注册冲突与缺少默认导出可诊断

系统 MUST 在构建时拒绝缺少默认导出的入口，并指出文件路径与预期标签。自动组件名称重复或占用固定绑定名称时，系统 MUST 报错，不按扫描顺序覆盖；MDX 静态检查也 MUST 使用相同的名称冲突规则。

#### Scenario: 入口只有具名导出

- **WHEN** `notice-box.tsx` 只有具名导出，没有默认导出
- **THEN** 构建失败，错误指出该入口及预期的 `NoticeBox` 标签

#### Scenario: 自动入口占用 Link

- **WHEN** 作者新增 `src/components/mdx/link.tsx`
- **THEN** 构建和 MDX 静态检查报告其与固定 `Link` 绑定冲突，不覆盖已有站内导航组件

### Requirement: 保留现有组件与 Markdown 语义

系统 SHALL 保留 `Card`、`Link`、`HintText`、`GameCard`、`GamePlatformCard`、`Grid`、`ProjectCard` 七个标签的现有组件接口。固定 `Link` 继续提供站内页面导航，`a` 遵循文章链接渲染规则，`img` 保留图片预览处理；自动发现 MUST NOT 覆盖这些固定绑定，也不引入额外别名。

#### Scenario: 现有文章无需改写组件标签

- **WHEN** 现有文章使用上述七个标签和原有 props
- **THEN** 标签继续解析到相同功能的组件，MDX 正文无需为目录调整添加导入或更换名称

#### Scenario: Markdown 链接和图片

- **WHEN** 文章包含 Markdown 链接和图片
- **THEN** 链接仍按相对文章链接能力及既有外链规则渲染，图片继续支持预览
- **AND** 组件自动注册本身不改变这些展示和交互语义

### Requirement: 静态检查与运行时共享组件命名规则

MDX 静态检查 SHALL 从同一个约定目录和命名规则获得有效组件名称，并包含固定的 `Link` 绑定。重新执行检查 MUST 能识别新增或删除的入口，不要求先运行 Gatsby 或生成清单，也不保留已删除组件的手写全局变量。

#### Scenario: 干净环境识别新增标签

- **WHEN** 新增合法默认导出组件后直接执行 MDX 的 ESLint 检查，尚未运行 Gatsby
- **THEN** 对应标签被识别为已定义的组件，不因缺少旧清单而报告未定义

#### Scenario: 删除入口后检查残留引用

- **WHEN** 组件入口被删除，正文仍引用该组件，并重新执行 MDX 静态检查
- **THEN** 残留引用报告未定义组件，不由手写 globals 或别名继续放行

### Requirement: 保留显式导入与局部作用域

系统 SHALL 保留 MDX 的显式导入、局部定义以及其对同名全局组件的原生优先级。自动发现只提供全局缺省组件，不改写正文的 import/export、局部标识符、资源导入或属性表达式。

#### Scenario: 局部导入覆盖同名全局组件

- **WHEN** 某篇 MDX 显式导入或局部定义自己的 `Card`
- **THEN** 该文中的 `<Card />` 使用局部组件，其他文章继续使用全局默认的 `Card`

#### Scenario: 关于页面的图片和图标导入

- **WHEN** 关于页面显式导入图片资源或图标用于 JSX 属性
- **THEN** 这些导入与表达式保持原生语义，不被组件目录发现改写或替代

### Requirement: 构建与开发环境使用一致组件集合

系统 SHALL 在生产服务端渲染与浏览器中提供相同的组件集合，保持组件 props 和 SSR 行为。开发服务器下一次编译 SHALL 识别目录内合法入口的增加、删除或重命名；允许刷新页面查看结果，不要求重新启动服务器或手动更新注册文件。

#### Scenario: 生产页面与浏览器一致

- **WHEN** 生产构建渲染使用约定组件的文章，再在浏览器加载该页面
- **THEN** 两个阶段识别相同的组件标签，不因注册方式出现组件缺失或 hydration 不匹配

#### Scenario: 开发时增删入口

- **WHEN** 开发服务器运行中新增或移除合法组件入口并完成重新编译
- **THEN** 刷新页面后组件集合反映文件变化，不需要改写模板或注册名单
