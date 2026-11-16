import { type MDXProvider } from "@mdx-js/react";
import { Link } from "gatsby";
import type * as React from "react";

import {
  discoverMdxComponentEntries,
  extractDefaultMdxComponent,
} from "../utils/mdx-components";
import ALink from "./a";
import FancyBoxImage from "./img";

type MDXProviderComponents = NonNullable<
  Exclude<
    React.ComponentProps<typeof MDXProvider>["components"],
    ((...args: never[]) => unknown) | null | undefined
  >
>;

type DiscoveredComponent = React.ComponentType<Record<string, unknown>>;

const mdxComponentContext = require.context(
  "../components/mdx",
  false,
  /^\.\/[^/]+\.tsx$/,
);

const discoveredComponents: Record<string, DiscoveredComponent> = {};

for (const { entry, componentName } of discoverMdxComponentEntries(
  mdxComponentContext.keys(),
)) {
  const moduleExports = mdxComponentContext(entry);
  discoveredComponents[componentName] =
    extractDefaultMdxComponent<DiscoveredComponent>(
      moduleExports,
      entry,
      componentName,
    );
}

const components: MDXProviderComponents = {
  ...discoveredComponents,
  a: ALink,
  img: FancyBoxImage,
  Link,
};

export default components;
