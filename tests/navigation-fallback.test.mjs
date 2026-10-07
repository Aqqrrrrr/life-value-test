import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function pageFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? pageFiles(target) : entry.name === "page.tsx" ? [target] : [];
  }));
  return nested.flat();
}

test("page navigation uses native anchors while Vinext Link navigation is unavailable", async () => {
  const pages = await pageFiles(path.join(root, "app"));
  const sources = await Promise.all(pages.map((file) => readFile(file, "utf8")));

  for (const source of sources) {
    assert.doesNotMatch(source, /from\s+["']next\/link["']/);
  }

  const home = sources[pages.findIndex((file) => file === path.join(root, "app", "page.tsx"))];
  assert.match(home, /<a[^>]+href="\/test"/);
});
