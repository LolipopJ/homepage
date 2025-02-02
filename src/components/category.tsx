import { Link } from "gatsby";
import * as React from "react";

export interface CategoryProps {
  name: string;
  className?: string;
}

const Category: React.FC<CategoryProps> = ({ name, className = "" }) => {
  return (
    <Link
      to={`/categories/${encodeURIComponent(name)}`}
      className={`item-converse-color w-fit rounded px-3 py-2 text-sm leading-none hover:border-primary-dark ${className}`}
    >
      {name}
    </Link>
  );
};

export default Category;
