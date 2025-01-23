import { Link } from "gatsby";
import * as React from "react";

export interface CategoryProps {
  name: string;
  className?: string;
}

const Category = ({ name, className = "" }: CategoryProps) => {
  return (
    <Link
      to={`/categories/${encodeURIComponent(name)}`}
      className={`item-converse-color item-selectable w-fit rounded-full px-3 py-2 leading-none ${className}`}
    >
      {name}
    </Link>
  );
};

export default Category;
