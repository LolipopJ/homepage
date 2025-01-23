import { Link } from "gatsby";
import * as React from "react";

export interface TagProps {
  name: string;
  className?: string;
}

const Tag = ({ name, className = "" }: TagProps) => {
  return (
    <Link
      to={`/tags/${encodeURIComponent(name)}`}
      className={`before:mr-0.5 before:text-sm before:content-['#'] ${className}`}
    >
      {name}
    </Link>
  );
};

export default Tag;
