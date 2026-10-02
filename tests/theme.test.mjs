import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

import {
  getThemeScript,
  THEME_COLORS,
  THEME_STORAGE_KEY,
} from "../src/utils/theme.ts";

const require = createRequire(import.meta.url);
const postcss = require("postcss");
const themeScope = require("../plugins/postcss-theme-scope.cjs");

function browser({
  stored = null,
  dark = false,
  blocked = false,
  mediaMissing = false,
} = {}) {
  const attributes = {};
  const meta = {};
  const lightbox = {};
  const root = {
    style: {},
    setAttribute: (key, value) => {
      attributes[key] = value;
    },
  };
  const context = {
    document: {
      documentElement: root,
      querySelector: () => ({
        setAttribute: (key, value) => {
          meta[key] = value;
        },
      }),
      querySelectorAll: () => [
        {
          setAttribute: (key, value) => {
            lightbox[key] = value;
          },
        },
      ],
    },
    window: {
      localStorage: {
        getItem: (key) => {
          assert.equal(key, THEME_STORAGE_KEY);
          if (blocked) throw new Error("Storage denied");
          return stored;
        },
        setItem: () => {
          throw new Error("Bootstrap must not persist the system theme");
        },
      },
      matchMedia: mediaMissing ? undefined : () => ({ matches: dark }),
    },
  };
  vm.runInNewContext(getThemeScript(), context);
  return { attributes, root, meta, lightbox };
}

for (const dark of [false, true]) {
  test(`first visit uses ${dark ? "dark" : "light"} system theme before React`, () => {
    const actual = browser({ dark });
    const expected = dark ? "dark" : "light";
    assert.equal(actual.attributes["data-theme"], expected);
    assert.equal(actual.root.style.colorScheme, expected);
    assert.equal(actual.meta.content, THEME_COLORS[expected]);
    assert.equal(actual.lightbox.theme, expected);
  });
}

for (const stored of ["light", "dark"]) {
  test(`saved ${stored} preference takes priority over opposite system theme`, () => {
    assert.equal(
      browser({ stored, dark: stored === "light" }).attributes["data-theme"],
      stored,
    );
  });
}

test("invalid persisted preference falls back to the system", () => {
  assert.equal(
    browser({ stored: "unexpected", dark: true }).attributes["data-theme"],
    "dark",
  );
});

test("blocked storage still detects the system preference", () => {
  assert.equal(
    browser({ blocked: true, dark: true }).attributes["data-theme"],
    "dark",
  );
});

test("missing matchMedia falls back to light", () => {
  assert.equal(
    browser({ mediaMissing: true }).attributes["data-theme"],
    "light",
  );
});

test("vendor themes are scoped without corrupting comma selectors or keyframes", async () => {
  const css =
    ".gt-container, .markdown-body :is(h1, h2) { color: red; } @keyframes loading { 0% { opacity: 0; } }";
  const result = await postcss([themeScope()]).process(css, {
    from: "/node_modules/gitalk-react/dist/gitalk-light.css",
  });
  assert.ok(result.css.includes('html[data-theme="light"] .gt-container'));
  assert.ok(
    result.css.includes('html[data-theme="light"] .markdown-body :is(h1, h2)'),
  );
  assert.ok(result.css.includes("0% { opacity: 0; }"));
  assert.ok(!result.css.includes('html[data-theme="light"] 0%'));
});

test("Prism palettes are scoped and site rules keep their original selectors", async () => {
  const scoped = await postcss([themeScope()]).process(
    ".token.keyword { color: red; }",
    {
      from: "/node_modules/prismjs/themes/prism-tomorrow.min.css",
    },
  );
  assert.ok(scoped.css.includes('html[data-theme="dark"] .token.keyword'));
  const site = await postcss([themeScope()]).process(
    ".item-link { color: green; }",
    {
      from: "/src/styles/global.css",
    },
  );
  assert.ok(!site.css.includes("data-theme"));
});
