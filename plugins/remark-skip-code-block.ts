import remarkGfm from "remark-gfm";

const SKIPPED_LANGUAGES = ["mermaid"];

/**
 * 自定义 remark 插件，在 prismjs 处理前标记代码块
 * 防止 prismjs 对特定代码块进行高亮处理
 */
export const remarkSkipCodeBlock: remarkGfm.Gfm = () => {
  return (tree) => {
    // 遍历 AST 节点
    if (!tree.children) return;

    tree.children = tree.children.map((node) => {
      // 找到代码块节点
      if (node.type === "code" && SKIPPED_LANGUAGES.includes(node.lang)) {
        // 添加 meta 标记，告诉 prismjs 跳过此代码块
        node.meta = ` no-highlight ${node.meta || ""}`;
      }
      return node;
    });
  };
};
