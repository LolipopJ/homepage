import * as React from "react";

/** 网格划分的总份数，卡片宽度以该值作为基准 */
export const GRID_UNITS = 24;

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

/**
 * 正文中的网格容器
 * @description 与正文中的图片一样向两侧突破正文栏，子元素通过 `col-span-1` 至 `col-span-24` 设置列宽
 */
const Grid: React.FC<GridProps> = ({ className = "", ...restProps }) => (
  <div
    className={`
      post-grid -mx-6 my-6 grid w-[calc(100%+3rem)] grid-cols-24 gap-3
      ${className}
    `}
    {...restProps}
  />
);

export default Grid;
