import type { Node, NodePluginSchema } from "gatsby";
import path from "path";

import { resolveBlogContent } from "../src/utils/post.ts";

export const COVER_BASENAMES = ["cover", "banner"] as const;

export const SUPPORTED_COVER_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "avif",
  "tif",
  "tiff",
] as const;

const SUPPORTED_EXT_SET = new Set<string>(SUPPORTED_COVER_EXTENSIONS);

export interface ResolveCoverOptions {
  explicitBanner: unknown;
  sourceFilePath: string;
  blogRoot: string;
  fileExists: (absPath: string) => boolean | Promise<boolean>;
  listDirFiles: (absDir: string) => string[] | Promise<string[]>;
}

interface GatsbyFileNode extends Node {
  absolutePath?: string;
  dir?: string;
  base?: string;
}

interface GatsbyNodeModel {
  findRootNodeAncestor: (
    obj: unknown,
    predicate: (node: Node) => boolean,
  ) => GatsbyFileNode | null;
  findOne: (args: {
    type: string;
    query: { filter: Record<string, unknown> };
  }) => Promise<GatsbyFileNode | null>;
  findAll: (args: {
    type: string;
    query: { filter: Record<string, unknown> };
  }) => Promise<{ entries: Iterable<GatsbyFileNode> }>;
}

interface MdxFrontmatterSource {
  banner?: unknown;
}

/** 检查扩展名（不含点号）是否属于受支持的封面图片格式 */
export function isSupportedCoverExtension(
  ext: string,
  caseSensitive = true,
): boolean {
  const normalized = caseSensitive ? ext : ext.toLowerCase();
  return SUPPORTED_EXT_SET.has(normalized);
}

/** 按 cover -> banner 优先级从目录文件名中选择唯一封面；同级多候选时报错 */
export function selectAutoCoverCandidate(
  filenames: string[],
  sourcePath: string,
  coverDir: string,
): string | null {
  const displayDir = coverDir.replace(/\\/g, "/");

  for (const basename of COVER_BASENAMES) {
    const matches = Array.from(
      new Set(
        filenames.filter((filename) => {
          const dotIndex = filename.lastIndexOf(".");
          if (dotIndex <= 0) return false;
          const stem = filename.slice(0, dotIndex);
          const ext = filename.slice(dotIndex + 1);
          return stem === basename && isSupportedCoverExtension(ext, true);
        }),
      ),
    ).sort();

    if (matches.length === 1) {
      return matches[0];
    }

    if (matches.length > 1) {
      const candidates = matches
        .map((name) => path.posix.join(displayDir, name))
        .join(", ");
      throw new Error(
        `Ambiguous auto-discovered cover for "${sourcePath}": multiple "${basename}.*" candidates found (${candidates}).`,
      );
    }
  }

  return null;
}

/** 计算相对于文章所在目录的封面文件路径；无封面时返回 null */
export async function resolveCoverRelativePath({
  explicitBanner,
  sourceFilePath,
  blogRoot,
  fileExists,
  listDirFiles,
}: ResolveCoverOptions): Promise<string | null> {
  const sourceDir = path.dirname(sourceFilePath);

  if (explicitBanner !== undefined && explicitBanner !== null) {
    if (typeof explicitBanner !== "string") {
      throw new Error(
        `Invalid frontmatter.banner in "${sourceFilePath}": expected a relative image path string, got ${typeof explicitBanner}.`,
      );
    }

    const trimmed = explicitBanner.trim();
    if (trimmed !== "") {
      const ext = path.extname(trimmed).slice(1);
      if (!ext || !isSupportedCoverExtension(ext, false)) {
        throw new Error(
          `Unsupported frontmatter.banner format in "${sourceFilePath}": "${trimmed}". Supported formats: ${SUPPORTED_COVER_EXTENSIONS.join(", ")}.`,
        );
      }

      const targetAbsPath = path.resolve(sourceDir, trimmed);
      const exists = await fileExists(targetAbsPath);
      if (!exists) {
        throw new Error(
          `Explicit frontmatter.banner not found for "${sourceFilePath}": "${trimmed}" (resolved to "${targetAbsPath}").`,
        );
      }

      return trimmed;
    }
  }

  const relativeToBlog = path.relative(blogRoot, sourceFilePath);
  const resolved = resolveBlogContent(relativeToBlog);
  if (!resolved) {
    return null;
  }

  const coverAbsDir = path.join(blogRoot, resolved.coverDir);
  const dirFiles = await listDirFiles(coverAbsDir);
  const candidate = selectAutoCoverCandidate(
    dirFiles,
    sourceFilePath,
    resolved.coverDir,
  );
  if (!candidate) {
    return null;
  }

  return path
    .relative(sourceDir, path.join(coverAbsDir, candidate))
    .replace(/\\/g, "/");
}

function toSlashedWithDriveMatch(targetPath: string, referencePath: string) {
  const slashed = targetPath.replace(/\\/g, "/");
  if (
    /^[a-zA-Z]:/.test(slashed) &&
    /^[a-zA-Z]:/.test(referencePath) &&
    slashed[0].toLowerCase() === referencePath[0].toLowerCase()
  ) {
    return `${referencePath[0]}${slashed.slice(1)}`;
  }
  return slashed;
}

/** 创建基于 Gatsby File 节点查询的 MdxFrontmatter.banner 解析器 */
export function createMdxBannerResolver(blogRoot: string) {
  return async function resolveMdxBanner(
    source: MdxFrontmatterSource,
    _args: Record<string, unknown>,
    context: { nodeModel: GatsbyNodeModel },
  ): Promise<string | null> {
    const parentFileNode = context.nodeModel.findRootNodeAncestor(
      source,
      (node) => node?.internal?.type === "File",
    );

    if (!parentFileNode?.absolutePath || !parentFileNode?.dir) {
      return null;
    }

    const parentDir = parentFileNode.dir;

    return resolveCoverRelativePath({
      explicitBanner: source?.banner,
      sourceFilePath: parentFileNode.absolutePath,
      blogRoot,
      fileExists: async (absPath) => {
        const normalized = toSlashedWithDriveMatch(absPath, parentDir);
        const found = await context.nodeModel.findOne({
          type: "File",
          query: {
            filter: {
              absolutePath: { eq: normalized },
            },
          },
        });
        return Boolean(found);
      },
      listDirFiles: async (absDir) => {
        const normalizedDir = toSlashedWithDriveMatch(absDir, parentDir);
        const { entries } = await context.nodeModel.findAll({
          type: "File",
          query: {
            filter: {
              dir: { eq: normalizedDir },
            },
          },
        });
        const filenames: string[] = [];
        for (const entry of entries) {
          if (typeof entry?.base === "string") {
            filenames.push(entry.base);
          }
        }
        return filenames;
      },
    });
  };
}

/** 生成用于 Gatsby createSchemaCustomization 的 MdxFrontmatter 类型定义 */
export function buildPostCoverTypeDefs(
  schema: NodePluginSchema,
  blogRoot: string,
) {
  return [
    schema.buildObjectType({
      name: "MdxFrontmatter",
      fields: {
        banner: {
          type: "File",
          extensions: {
            fileByRelativePath: {},
          },
          resolve: createMdxBannerResolver(blogRoot),
        },
      },
      extensions: {
        infer: true,
      },
    }),
  ];
}
