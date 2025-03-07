import { liteClient as algoliasearch } from "algoliasearch/lite";
import * as React from "react";
import {
  Configure,
  Highlight,
  Hits,
  HitsProps,
  InstantSearch,
  InstantSearchProps,
  Pagination,
  SearchBox,
} from "react-instantsearch";

import {
  ALGOLIA_API_PUBLIC_KEY,
  ALGOLIA_APP_ID,
  ALGOLIA_INDEX_NAME,
} from "../constants/algolia";
import { type Post as PostType } from "../hooks/useAllMdx";
import Post from "./post";

export interface AlgoliaSearchProps
  extends Omit<InstantSearchProps, "searchClient" | "indexName"> {
  onClose: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_PUBLIC_KEY);

const Hit: React.FC<
  React.ComponentProps<NonNullable<HitsProps<PostType>["hitComponent"]>> & {
    onPostClick: () => void;
  }
> = ({ hit, onPostClick }) => {
  return (
    <Post
      post={hit}
      onClick={onPostClick}
      titleRenderer={() => (
        <Highlight attribute={["frontmatter", "title"]} hit={hit} />
      )}
      excerptRenderer={() => <Highlight attribute={["excerpt"]} hit={hit} />}
    />
  );
};

const AlgoliaSearch: React.FC<AlgoliaSearchProps> = ({
  onClose,
  className,
  style,
  ...restProps
}) => {
  React.useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`flex h-[568px] max-w-2xl flex-col rounded-xl ${className}`}
      style={style}
    >
      <InstantSearch
        insights
        searchClient={searchClient}
        indexName={ALGOLIA_INDEX_NAME}
        {...restProps}
      >
        <Configure hitsPerPage={10} />
        <SearchBox
          className="algolia-search-box"
          onResetCapture={() => onClose()}
        />
        <Hits<PostType>
          className="algolia-hints"
          hitComponent={(props) => <Hit {...props} onPostClick={onClose} />}
        />
        <Pagination className="algolia-pagination" />
      </InstantSearch>
    </div>
  );
};

export default AlgoliaSearch;
