import { animated, useSpringRef, useTransition } from "@react-spring/web";
import * as React from "react";

export interface SiderBarProps<T = string>
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLElement>,
    HTMLElement
  > {
  items?: SiderBarItem<T>[];
  activeKey?: SiderBarItem<T>["key"];
  onActiveKeyChange?: (key: SiderBarItem<T>["key"]) => void;
  headerClassName?: string;
  bodyClassName?: string;
  header?: React.ReactElement;
}

export interface SiderBarItem<T> {
  key: T;
  label: string;
  children: React.ReactElement;
}

const SiderBar = <T extends string>(props: SiderBarProps<T>) => {
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
  const transitionRef = useSpringRef();
  const transitions = useTransition(activeKey, {
    ref: transitionRef,
    from: { opacity: 0, transform: "translate3d(20%,0,0)" },
    enter: { opacity: 1, transform: "translate3d(0%,0,0)" },
    leave: { opacity: 0, transform: "translate3d(-40%,0,0)" },
    config: { duration: 150 },
    exitBeforeEnter: true,
  });

  React.useEffect(() => {
    if (activeKey) {
      transitionRef.start();
    }
  }, [activeKey, transitionRef]);

  if (!children && items.length === 0) return null;

  return (
    <aside
      className={`border-r border-foreground-tertiary bg-background-light ${className}`}
      {...restProps}
    >
      <div className="flex h-header items-center">
        {header || (
          <div className={headerClassName}>
            <ul className="flex select-none gap-1 rounded-full border border-foreground-tertiary bg-neutral-800 p-0.5">
              {items.map((item) => (
                <li
                  key={item.key}
                  className={`cursor-pointer rounded-full px-3 py-0.5 font-medium transition ${activeKey === item.key ? "item-converse-color" : ""}`}
                  onClick={() => {
                    onActiveKeyChange?.(item.key);
                  }}
                >
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="h-[calc(100vh-var(--height-header))] overflow-y-auto">
        {children || (
          <div className={bodyClassName}>
            {transitions((style, key) => {
              const item = items.find((item) => item.key === key);
              return (
                <animated.div key={item?.key} style={style}>
                  {item?.children}
                </animated.div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};

export default SiderBar;
