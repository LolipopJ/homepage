import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  discoverMdxComponentEntries,
  extractDefaultMdxComponent,
  FIXED_MDX_COMPONENT_NAMES,
  getMdxGlobalComponentNames,
} from "../src/utils/mdx-components.ts";

test("discovers only top-level .tsx files, maps kebab-case to PascalCase, and sorts stably", () => {
  const entries = discoverMdxComponentEntries([
    "./project-card.tsx",
    "./internal/preview.tsx",
    "./helpers.ts",
    "./game-platform-card.tsx",
    "./card.tsx",
    "./v2-notice-box.tsx",
    "sub/nested.tsx",
  ]);

  assert.deepEqual(
    entries.map((item) => ({
      filename: item.filename,
      componentName: item.componentName,
    })),
    [
      { filename: "card.tsx", componentName: "Card" },
      {
        filename: "game-platform-card.tsx",
        componentName: "GamePlatformCard",
      },
      { filename: "project-card.tsx", componentName: "ProjectCard" },
      { filename: "v2-notice-box.tsx", componentName: "V2NoticeBox" },
    ],
  );

  assert.deepEqual(
    getMdxGlobalComponentNames(["./project-card.tsx", "./card.tsx"]),
    ["Link", "Card", "ProjectCard"],
  );
});

test("rejects invalid top-level .tsx filenames with path and naming rule", () => {
  for (const bad of [
    "./GameCard.tsx",
    "./game_card.tsx",
    "./-card.tsx",
    "./card-.tsx",
    "./game--card.tsx",
    "./2card.tsx",
  ]) {
    assert.throws(
      () => discoverMdxComponentEntries([bad]),
      (err) =>
        err instanceof Error &&
        err.message.includes(bad) &&
        err.message.includes("kebab-case"),
    );
  }
});

test("rejects auto-discovered entry conflicting with fixed bindings", () => {
  assert.ok(FIXED_MDX_COMPONENT_NAMES.includes("Link"));
  assert.throws(
    () => discoverMdxComponentEntries(["./link.tsx"]),
    (err) =>
      err instanceof Error &&
      err.message.includes("link.tsx") &&
      err.message.includes("Link"),
  );
});

test("rejects entry missing default export with entry path and expected tag name", () => {
  const FakeComponent = () => null;
  assert.equal(
    extractDefaultMdxComponent(
      { default: FakeComponent },
      "./card.tsx",
      "Card",
    ),
    FakeComponent,
  );

  assert.throws(
    () =>
      extractDefaultMdxComponent(
        { NoticeBox: FakeComponent },
        "./notice-box.tsx",
        "NoticeBox",
      ),
    (err) =>
      err instanceof Error &&
      err.message.includes("notice-box.tsx") &&
      err.message.includes("NoticeBox"),
  );
});

test("real src/components/mdx directory produces the seven existing public tags", () => {
  const mdxDir = path.resolve("src/components/mdx");
  const filenames = fs
    .readdirSync(mdxDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);

  assert.deepEqual(getMdxGlobalComponentNames(filenames), [
    "Link",
    "Card",
    "GameCard",
    "GamePlatformCard",
    "Grid",
    "HintText",
    "ProjectCard",
  ]);
});
