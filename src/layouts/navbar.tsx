import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { Link } from "gatsby";
import * as React from "react";

import Icon from "../components/icon";

export interface NavbarProps {
  items: { routes: Route[]; title?: string }[];
  activeKey: Route["url"];
  className?: string;
}

interface Route {
  icon: IconDefinition;
  label: string;
  url: string;
}

const Navbar = ({ items, activeKey, className }: NavbarProps) => {
  return (
    <div className={className}>
      {items.map((item) => {
        return (
          <nav className="mb-6" key={item.title}>
            {item.title && (
              <div className="mb-2 px-3 text-sm font-bold text-neutral-400">
                {item.title}
              </div>
            )}
            <ul>
              {item.routes.map((route) => {
                const isSelected = activeKey === route.url;
                const isExternal = !/^\//.test(route.url);

                return (
                  <li key={route.url} className="mb-0.5">
                    <Link
                      to={route.url}
                      target={isExternal ? "_blank" : undefined}
                      className={`item-selectable flex items-center rounded-md px-1 py-2 text-base ${isSelected ? "item-selected" : ""}`}
                    >
                      <Icon icon={route.icon} className="w-8" />
                      <span className="mr-6">{route.label}</span>
                      {isExternal && (
                        <Icon
                          icon={faArrowUp}
                          className="ml-auto w-8 rotate-45"
                        />
                      )}
                    </Link>
                  </li>
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
