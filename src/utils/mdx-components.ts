export const FIXED_MDX_COMPONENT_NAMES = ["Link", "a", "img"] as const;

export const FIXED_MDX_GLOBAL_COMPONENT_NAMES = ["Link"] as const;

const KEBAB_STEM_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export interface DiscoveredMdxComponentEntry {
  entry: string;
  filename: string;
  componentName: string;
}

function normalizeTopLevelEntry(entryKey: string): string | null {
  const normalized = entryKey.replace(/\\/g, "/").replace(/^\.\//, "");
  if (!normalized || normalized.includes("/") || !normalized.endsWith(".tsx")) {
    return null;
  }
  return normalized;
}

/** 将合法的 kebab-case 文件基名转换为 PascalCase 组件标签名 */
export function kebabCaseToPascalCase(stem: string): string {
  return stem
    .split("-")
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join("");
}

/** 从约定目录中的顶层 .tsx 文件列表发现并校验 MDX 自动注册入口 */
export function discoverMdxComponentEntries(
  keys: string[],
): DiscoveredMdxComponentEntry[] {
  const topLevel = keys
    .map((entry) => ({
      entry,
      filename: normalizeTopLevelEntry(entry),
    }))
    .filter(
      (item): item is { entry: string; filename: string } =>
        item.filename !== null,
    )
    .sort((a, b) =>
      a.filename < b.filename ? -1 : a.filename > b.filename ? 1 : 0,
    );

  const fixedSet = new Set<string>(FIXED_MDX_COMPONENT_NAMES);
  const seenNames = new Map<string, string>();
  const discovered: DiscoveredMdxComponentEntry[] = [];

  for (const { entry, filename } of topLevel) {
    const stem = filename.slice(0, -".tsx".length);
    if (!KEBAB_STEM_RE.test(stem)) {
      throw new Error(
        `Invalid MDX component entry "${entry}": top-level .tsx filenames must be lowercase kebab-case starting with a letter and using single hyphens (e.g. "notice-box.tsx").`,
      );
    }

    const componentName = kebabCaseToPascalCase(stem);

    if (fixedSet.has(componentName)) {
      throw new Error(
        `MDX component entry "${entry}" resolves to "${componentName}", which conflicts with the fixed MDX binding "${componentName}".`,
      );
    }

    const existing = seenNames.get(componentName);
    if (existing) {
      throw new Error(
        `Duplicate MDX component name "${componentName}" from entries "${existing}" and "${entry}".`,
      );
    }

    seenNames.set(componentName, entry);
    discovered.push({ entry, filename, componentName });
  }

  return discovered;
}

/** 提取并校验 MDX 组件入口模块的默认导出 */
export function extractDefaultMdxComponent<T = unknown>(
  moduleExports: unknown,
  entry: string,
  componentName: string,
): T {
  const defaultExport =
    moduleExports !== null &&
    (typeof moduleExports === "object" || typeof moduleExports === "function")
      ? (moduleExports as { default?: unknown }).default
      : undefined;

  if (
    typeof defaultExport !== "function" &&
    (typeof defaultExport !== "object" || defaultExport === null)
  ) {
    throw new Error(
      `MDX component entry "${entry}" must have a default export for <${componentName} />.`,
    );
  }

  return defaultExport as T;
}

/** 计算供 ESLint MDX globals 使用的全部可用组件名称（包含固定 Link 绑定） */
export function getMdxGlobalComponentNames(keys: string[]): string[] {
  const discovered = discoverMdxComponentEntries(keys);
  return [
    ...FIXED_MDX_GLOBAL_COMPONENT_NAMES,
    ...discovered.map((item) => item.componentName),
  ];
}
