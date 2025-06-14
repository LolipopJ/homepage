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
    children,
    className = "",
    ...restProps
  } = props;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const savedScrollTopRef = React.useRef<Record<string, number>>({});

  const transitionRef = useSpringRef();
  const transitions = useTransition(activeKey, {
    ref: transitionRef,
    from: { opacity: 0, transform: "translate3d(20%,0,0)" },
    enter: { opacity: 1, transform: "translate3d(0%,0,0)" },
    leave: { opacity: 0, transform: "translate3d(-40%,0,0)" },
    config: { duration: TRANSITION_DURATION },
    exitBeforeEnter: true,
  });

  React.useEffect(() => {
    setTimeout(() => {
      containerRef.current?.scrollTo({
        top: savedScrollTopRef.current?.[String(activeKey)] ?? 0,
        behavior: "instant",
      });
    }, TRANSITION_DURATION);

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      savedScrollTopRef.current[String(activeKey)] =
        // eslint-disable-next-line react-hooks/exhaustive-deps
        containerRef.current?.scrollTop ?? 0;
    };
  }, [activeKey]);

  React.useEffect(() => {
    if (activeKey) {
      transitionRef.start();
    }
  }, [activeKey, transitionRef]);

  return (
    <aside
      className={`border-r border-foreground-tertiary bg-background-light ${className}`}
      {...restProps}
    >
      <div className={`flex h-header items-center ${headerClassName}`}>
        {header || (
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
        )}
      </div>
      <div
        ref={containerRef}
        className={`h-[calc(100vh-var(--height-header))] overflow-y-auto overflow-x-hidden ${bodyClassName}`}
      >
        {children ||
          transitions((style, key) => {
            const item = items.find((item) => item.key === key);
            return (
              <animated.div key={item?.key} className="h-full" style={style}>
                {item?.children}
              </animated.div>
            );
          })}
      </div>
    </aside>
  );
};

export default SiderBar;
