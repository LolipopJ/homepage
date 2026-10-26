import { animated, useTransition } from "@react-spring/web";
import * as React from "react";

export interface SiderBarProps<T = string> extends React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
> {
  items?: SiderBarItem<T>[];
  activeKey?: SiderBarItem<T>["key"];
  onActiveKeyChange?: (key: SiderBarItem<T>["key"]) => void;
  headerClassName?: string;
  bodyClassName?: string;
  header?: React.ReactElement;
  headerExtra?: React.ReactNode;
}

export interface SiderBarItem<T = string> {
  key: T;
  label: string;
  children: React.ReactElement;
}

const TRANSITION_DURATION = 150;

const SiderBar = <T extends string>(props: SiderBarProps<T>) => {
  const {
    items = [],
    activeKey,
    onActiveKeyChange,
    headerClassName = "",
    bodyClassName = "",
    header,
    headerExtra,
    children,
    className = "",
    ...restProps
  } = props;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const savedScrollTopRef = React.useRef<Record<string, number>>({});

  const handleTabClick = React.useCallback(
    (key: T) => {
      if (activeKey != null && containerRef.current) {
        savedScrollTopRef.current[String(activeKey)] =
          containerRef.current.scrollTop;
      }
      onActiveKeyChange?.(key);
    },
    [activeKey, onActiveKeyChange],
  );

  const transitions = useTransition(activeKey, {
    from: { opacity: 0, transform: "translate3d(20%,0,0)" },
    enter: { opacity: 1, transform: "translate3d(0%,0,0)" },
    leave: { opacity: 0, transform: "translate3d(-40%,0,0)" },
    config: { duration: TRANSITION_DURATION },
    exitBeforeEnter: true,
  });

  React.useEffect(() => {
    if (!activeKey) return;
    const timer = setTimeout(() => {
      containerRef.current?.scrollTo({
        top: savedScrollTopRef.current[String(activeKey)] ?? 0,
        behavior: "instant",
      });
    }, TRANSITION_DURATION);
    return () => clearTimeout(timer);
  }, [activeKey]);

  return (
    <aside
      className={`flex flex-col border-r border-foreground-tertiary bg-background-light ${className}`}
      {...restProps}
    >
      <div
        className={`flex h-header shrink-0 items-center gap-2 ${headerClassName}`}
      >
        {header || (
          <ul
            role="tablist"
            className="flex shrink-0 select-none gap-1 whitespace-nowrap rounded-full border border-foreground-tertiary bg-background-lighter p-0.5 text-sm sm:text-base"
          >
            {items.map((item) => (
              <li
                key={item.key}
                role="tab"
                aria-selected={activeKey === item.key}
                tabIndex={0}
                className={`cursor-pointer rounded-full px-2 py-0.5 font-medium transition sm:px-3 ${activeKey === item.key ? "item-converse-color" : ""}`}
                onClick={() => handleTabClick(item.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    handleTabClick(item.key);
                }}
              >
                {item.label}
              </li>
            ))}
          </ul>
        )}
        {headerExtra && <div className="ml-auto shrink-0">{headerExtra}</div>}
      </div>

      <div
        ref={containerRef}
        className={`h-[calc(100vh-var(--height-header))] overflow-y-auto overflow-x-hidden ${bodyClassName}`}
      >
        {children ||
          transitions((style, key) => {
            const item = items.find((i) => i.key === key);
            if (!item) return null;
            return (
              <animated.div key={key} className="h-full" style={style}>
                {item.children}
              </animated.div>
            );
          })}
      </div>
    </aside>
  );
};

export default SiderBar;
