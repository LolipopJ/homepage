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
      className={`item-converse-color item-selectable w-fit rounded border-b-4 border-primary px-3 py-2 text-sm leading-none hover:border-primary-dark ${className}`}
    >
      {name}
    </Link>
  );
};

export default Category;
