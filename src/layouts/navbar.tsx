import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { Link } from "gatsby";
import * as React from "react";

import Icon from "../components/icon";

export interface NavbarProps {
  items: { routes: Route[]; title?: string }[];
  activeKey: string;
  className?: string;
}

export interface Route {
  icon: IconDefinition;
  label: string;
  url: string;
  regexp?: RegExp;
}

const Navbar: React.FC<NavbarProps> = ({ items, activeKey, className }) => {
  return (
    <div className={className}>
      {items.map((item) => {
        return (
          <nav className="mb-6" key={item.title}>
            {item.title && (
              <div className="relative mb-3 flex px-5 text-sm font-bold leading-5 text-foreground-secondary after:mb-2.5 after:ml-8 after:w-full after:border-b after:border-foreground-secondary after:opacity-40 after:content-['']">
                <span className="min-w-fit">{item.title}</span>
              </div>
            )}
            <ul>
              {item.routes.map((route) => {
                const isSelected = route.regexp
                  ? route.regexp.test(activeKey)
                  : activeKey === route.url;
                const isExternal = !/^\//.test(route.url);
                const linkClassName = `item-selectable flex items-center rounded-lg px-3 py-2 mb-1.5 text-base ${isSelected ? "item-selected" : ""}`;

                return React.cloneElement(
                  isExternal ? (
                    // eslint-disable-next-line jsx-a11y/anchor-has-content
                    <a href={route.url} target="_blank" rel="noreferrer" />
                  ) : (
                    <Link to={route.url} />
                  ),
                  {
                    className: linkClassName,
                    key: route.url,
                  },
                  <>
                    <Icon icon={route.icon} className="w-8" />
                    <span
                      className={`mr-6 flex-1 overflow-hidden text-ellipsis`}
                    >
                      {route.label}
                    </span>
                    {isExternal && (
                      <Icon
                        icon={faArrowUp}
                        className="ml-auto w-8 rotate-45"
                      />
                    )}
                  </>,
                );
              })}
            </ul>
          </nav>
        );
      })}
    </div>
  );
};

export default Navbar;
