import * as React from "react";

export interface SiderBarProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLElement>,
    HTMLElement
  > {
  activeKey?: string;
  activeKeys?: string[];
  onActiveKeyChange?: (key: string) => void;
  headerClassName?: string;
  bodyClassName?: string;
  header?: React.ReactElement;
}

const SiderBar = (props: SiderBarProps) => {
  const {
    activeKey,
    activeKeys,
    onActiveKeyChange,
    headerClassName = "",
    bodyClassName = "",
    header,
    children,
    className = "",
    ...restProps
  } = props;

  if (Array.isArray(activeKeys) && activeKeys.length === 0) return null;

  return (
    <aside
      className={`border-r border-neutral-600/80 bg-neutral-800/20 ${className}`}
      {...restProps}
    >
      <div className="flex h-16 items-center">
        {header || (
          <div className={headerClassName}>
            <ul className="flex gap-1 rounded-full border border-neutral-600/80 bg-neutral-800 p-0.5">
              {activeKeys?.map((key) => (
                <li
                  key={key}
                  className={`cursor-pointer rounded-full px-3 py-0.5 font-medium transition ${activeKey === key ? "bg-neutral-100 text-neutral-900" : ""}`}
                  onClick={() => {
                    onActiveKeyChange?.(key);
                  }}
                >
                  {key}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="h-[calc(100vh-4rem)] overflow-y-auto">
        <div className={bodyClassName}>{children}</div>
      </div>
    </aside>
  );
};

export default SiderBar;
