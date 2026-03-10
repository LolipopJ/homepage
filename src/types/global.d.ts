import type { ImageDataLike } from "gatsby-plugin-image";

declare global {
  interface SiteMetadata {
    /** 站点标题 */
    title: string;
    /** 站点拥有者 */
    owner: string;
    /** 站点描述 */
    description: string;
    /** 站点 base URL */
    siteUrl: string;
    [key: string]: unknown;
  }

  interface MdxNode {
    /** 正文内容 */
    body: string;
    /** 摘要 */
    excerpt: string;
    fields: {
      /** 博客地址 */
      slug: string;
      /** 是否为草稿 */
      isDraft: boolean;
    };
    frontmatter: {
      /** 封面图 */
      banner?: ImageDataLike;
      /** 分类 */
      categories?: string[];
      /** 标签 */
      tags?: string[];
      /** 标题 */
      title?: string;
      /** 发布时间 */
      date?: string;
      /** 更新时间 */
      updated?: string;
      /**
       * 显示时效性警告的阈值天数
       * @description 从博客最后一次更新开始计算，默认为 `365` 天。值为 `0` 时表示始终显示警告，值为负数时表示关闭警告
       */
      timeliness?: number;
    };
    id: string;
    internal: {
      contentDigest: string;
      contentFilePath: string;
    };
  }
}

export {};
