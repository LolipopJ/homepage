import * as React from "react";

export interface SiderBarProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLElement>,
    HTMLElement
  > {
  items?: {
    key: string;
    body: React.ReactElement;
  }[];
  activeKey?: string;
  onActiveKeyChange?: (key: string) => void;
  headerClassName?: string;
  bodyClassName?: string;
  header?: React.ReactElement;
}

const SiderBar = (props: SiderBarProps) => {
  const {
    items = [],
    activeKey,
    onActiveKeyChange,
    headerClassName = "",
    bodyClassName = "",
    header,
    children,
    className = "",
    ...restProps
  } = props;
  return (
    <aside
      className={`border-r border-neutral-600/80 bg-neutral-800/20 ${className}`}
      {...restProps}
    >
      <div className="flex h-16 items-center">
        {header || (
          <div className={headerClassName}>
            <ul className="flex gap-1 rounded-full border border-neutral-600/80 bg-neutral-800 p-0.5">
              {items.map((item) => (
                <li
                  key={item.key}
                  className={`cursor-pointer rounded-full px-3 py-0.5 font-medium transition ${activeKey === item.key ? "bg-neutral-100 text-neutral-900" : ""}`}
                  onClick={() => {
                    onActiveKeyChange?.(item.key);
                  }}
                >
                  {item.key}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="h-[calc(100vh-4rem)] overflow-y-auto">
        {children ||
          items.map((item) => (
            <div
              key={item.key}
              className={`${bodyClassName} ${activeKey === item.key ? "block" : "hidden"}`}
            >
              {item.body}
            </div>
          ))}
      </div>
    </aside>
  );
};

export default SiderBar;
