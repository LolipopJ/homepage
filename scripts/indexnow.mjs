import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import dotenv from "dotenv";

const DEFAULT_SITEMAP = "https://blog.towind.cn/sitemap.xml";
const DEFAULT_ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS_PER_BATCH = 10_000;
const REQUEST_TIMEOUT_MS = 30_000;
const INDEXNOW_KEY_RE = /^[a-zA-Z0-9-]{8,128}$/;

const STATUS_HINTS = new Map([
  [400, "Bad Request — check JSON payload format and required fields."],
  [
    403,
    "Forbidden — ensure the key .txt file is reachable at keyLocation and matches the key.",
  ],
  [
    422,
    "Unprocessable Entity — check that all URLs match host and the key format is valid.",
  ],
  [
    429,
    "Too Many Requests — rate limited; avoid frequent full-sitemap submissions.",
  ],
]);

const HELP_TEXT = `Usage: node scripts/indexnow.mjs [options]

Extract URLs from sitemap.xml and submit them to IndexNow.

Options:
  -k, --key <key>           IndexNow API key (or set INDEXNOW_KEY env var)
      --key-location <url>  Key verification file URL (default: <origin>/<key>.txt)
  -s, --sitemap <url|path>  Sitemap URL or local XML file (default: ${DEFAULT_SITEMAP})
  -e, --endpoint <url>      IndexNow API endpoint (default: ${DEFAULT_ENDPOINT})
      --dry-run             Parse sitemap and print payload summary without submitting
  -h, --help                Show this help message
`;

function decodeXmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function validateHttpUrl(rawUrl, label) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid ${label} URL: ${rawUrl}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${label} must use http or https protocol: ${rawUrl}`);
  }
  return parsed;
}

/**
 * Extract unique HTTP(S) URLs from a <urlset> sitemap and verify a single host.
 */
export function extractUrlsFromSitemap(xml) {
  if (/<sitemapindex[\s>]/i.test(xml)) {
    throw new Error(
      "Sitemap index (<sitemapindex>) is not supported; pass a <urlset> sitemap.",
    );
  }

  const seen = new Set();
  const urls = [];
  let host;
  let origin;

  for (const match of xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)) {
    const raw = decodeXmlEntities(match[1].trim());
    if (!raw) continue;

    const parsed = validateHttpUrl(raw, "sitemap <loc>");
    if (!host) {
      host = parsed.host;
      origin = parsed.origin;
    } else if (parsed.host !== host) {
      throw new Error(
        `Sitemap contains mixed hosts (${host} vs ${parsed.host}); IndexNow requires one host per request.`,
      );
    }

    if (!seen.has(parsed.href)) {
      seen.add(parsed.href);
      urls.push(parsed.href);
    }
  }

  if (urls.length === 0 || !host || !origin) {
    throw new Error("No <loc> URLs found in sitemap.");
  }

  return { host, origin, urls };
}

async function loadSitemapXml(source) {
  if (/^https?:\/\//i.test(source)) {
    const res = await fetch(source, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(
        `Failed to fetch sitemap (${res.status} ${res.statusText}): ${source}`,
      );
    }
    return res.text();
  }

  const filePath = path.resolve(source);
  return fs.readFile(filePath, "utf8");
}

function validateKey(key) {
  if (!INDEXNOW_KEY_RE.test(key)) {
    throw new Error(
      "Invalid IndexNow key: must be 8–128 characters using letters, digits, or hyphens.",
    );
  }
}

async function submitBatch({ endpoint, host, key, keyLocation, urlList }) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ host, key, keyLocation, urlList }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const body = (await res.text()).trim();
  if (res.status === 200 || res.status === 202) {
    return { status: res.status, body };
  }

  const hint = STATUS_HINTS.get(res.status);
  const details = [
    `IndexNow request failed with HTTP ${res.status}`,
    hint,
    body ? `Response: ${body}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  throw new Error(details);
}

/**
 * CLI entrypoint for manual IndexNow submission.
 */
export async function run(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    allowPositionals: false,
    options: {
      key: { type: "string", short: "k" },
      "key-location": { type: "string" },
      sitemap: { type: "string", short: "s", default: DEFAULT_SITEMAP },
      endpoint: { type: "string", short: "e", default: DEFAULT_ENDPOINT },
      "dry-run": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help) {
    console.log(HELP_TEXT);
    return;
  }

  dotenv.config({
    path: [".env.local", ".env.production", ".env"],
    quiet: true,
  });

  const endpoint = validateHttpUrl(values.endpoint, "endpoint").href;
  const xml = await loadSitemapXml(values.sitemap);
  const { host, origin, urls } = extractUrlsFromSitemap(xml);

  const key = (values.key ?? process.env.INDEXNOW_KEY ?? "").trim();
  if (!key && !values["dry-run"]) {
    throw new Error(
      "Missing IndexNow key. Pass --key <key> or set INDEXNOW_KEY in environment / .env.local.",
    );
  }
  if (key) {
    validateKey(key);
  }

  const keyLocation = values["key-location"]
    ? validateHttpUrl(values["key-location"], "keyLocation").href
    : `${origin}/${key || "<INDEXNOW_KEY>"}.txt`;

  if (new URL(keyLocation).host !== host) {
    throw new Error(
      `keyLocation host (${new URL(keyLocation).host}) must match sitemap host (${host}).`,
    );
  }

  const totalBatches = Math.ceil(urls.length / MAX_URLS_PER_BATCH);

  if (values["dry-run"]) {
    console.log("[indexnow] Dry run — no HTTP requests sent");
    console.log(`Endpoint:     ${endpoint}`);
    console.log(`Sitemap:      ${values.sitemap}`);
    console.log(`Host:         ${host}`);
    console.log(`Key location: ${keyLocation}`);
    console.log(`URLs:         ${urls.length} (${totalBatches} batch)`);
    if (!key) {
      console.log(
        "Warning:      INDEXNOW_KEY is not set; required for actual submission.",
      );
    }
    for (const url of urls) {
      console.log(`  - ${url}`);
    }
    return;
  }

  for (let i = 0; i < urls.length; i += MAX_URLS_PER_BATCH) {
    const batch = urls.slice(i, i + MAX_URLS_PER_BATCH);
    const batchIndex = Math.floor(i / MAX_URLS_PER_BATCH) + 1;
    const { status, body } = await submitBatch({
      endpoint,
      host,
      key,
      keyLocation,
      urlList: batch,
    });
    const note =
      status === 202 ? "Accepted (key validation pending)" : "OK (received)";
    console.log(
      `[indexnow] Batch ${batchIndex}/${totalBatches}: ${batch.length} URLs -> HTTP ${status} ${note}${body ? ` (${body})` : ""}`,
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(fsSync.realpathSync(process.argv[1])).href
) {
  run().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[indexnow] Error: ${message}`);
    process.exitCode = 1;
  });
}
