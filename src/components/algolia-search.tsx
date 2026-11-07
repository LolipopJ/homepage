import { faClose } from "@fortawesome/free-solid-svg-icons";
import { liteClient as algoliasearch } from "algoliasearch/lite";
import * as React from "react";
import {
  Configure,
  Highlight,
  Hits,
  type HitsProps,
  InstantSearch,
  type InstantSearchProps,
  Pagination,
  SearchBox,
} from "react-instantsearch";

import {
  ALGOLIA_API_PUBLIC_KEY,
  ALGOLIA_APP_ID,
  ALGOLIA_INDEX_NAME,
} from "../constants/algolia";
import Icon from "./icon";
import Post from "./post";

export interface AlgoliaSearchProps extends Omit<
  InstantSearchProps,
  "searchClient" | "indexName"
> {
  onClose: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export type AlgoliaPostItem = Pick<
  MdxNode,
  "excerpt" | "fields" | "frontmatter" | "id"
> & {
  internal: Pick<MdxNode["internal"], "contentDigest">;
};

const searchClient = algoliasearch(
  String(ALGOLIA_APP_ID),
  String(ALGOLIA_API_PUBLIC_KEY),
);

const Hit: React.FC<
  React.ComponentProps<
    NonNullable<HitsProps<AlgoliaPostItem>["hitComponent"]>
  > & {
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
      excerptClassName="line-clamp-3 md:line-clamp-4"
    />
  );
};

const AlgoliaSearch: React.FC<AlgoliaSearchProps> = ({
  onClose,
  className = "",
  style,
  ...restProps
}) => {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const closeDialog = () => dialogRef.current?.close();

  React.useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="search-title"
      onClose={(event) => {
        // close 事件异步触发，effect 重放后弹窗可能已重新打开。
        if (!event.currentTarget.open) onClose();
      }}
      onClick={closeDialog}
      className={`
        fixed inset-0 m-auto h-142
        max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))]
        w-[calc(100%-2rem)] max-w-2xl rounded-xl border
        border-foreground-tertiary bg-dialog-background p-0 text-foreground
        backdrop:bg-overlay backdrop:backdrop-blur-xs
        print:hidden
        ${className}
      `}
      style={style}
    >
      <div
        className="flex h-full min-h-0 flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-4 py-2">
          <h2 id="search-title" className="font-bold">
            搜索博客
          </h2>
          <button
            type="button"
            aria-label="关闭搜索"
            className="
              flex size-11 item-selectable items-center justify-center
              rounded-md
            "
            onClick={closeDialog}
          >
            <Icon icon={faClose} aria-hidden="true" />
          </button>
        </div>
        <InstantSearch
          insights
          searchClient={searchClient}
          indexName={ALGOLIA_INDEX_NAME}
          future={{ preserveSharedStateOnUnmount: true }}
          {...restProps}
        >
          <Configure hitsPerPage={10} />
          <SearchBox className="algolia-search-box" placeholder="输入关键词…" />
          <Hits<AlgoliaPostItem>
            className="algolia-hints"
            hitComponent={(props) => (
              <Hit {...props} onPostClick={closeDialog} />
            )}
          />
          <Pagination className="algolia-pagination" padding={1} />
        </InstantSearch>
      </div>
    </dialog>
  );
};

export default AlgoliaSearch;
