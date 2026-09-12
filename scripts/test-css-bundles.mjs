import assert from "node:assert/strict";
import {mkdtemp, mkdir, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {test} from "node:test";
import {fileURLToPath} from "node:url";
import {transform} from "esbuild";
import {assembleCss, checkCssEntryCoverage, CSS_BUNDLES, renderCssBundle} from "./css-bundles.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

async function fixture(run) {
  const root = await mkdtemp(path.join(os.tmpdir(), "opslaundry-css-"));
  try {
    await mkdir(path.join(root, "parts"));
    await writeFile(path.join(root, "parts/a.css"), ".card { color: red; }\n");
    await run(root);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
}

test("preserves repeated imports and cascade order", async () => {
  await fixture(async (root) => {
    const a = ".card { color: red; }\n";
    const b = '@media (max-width: 600px) { .card { color: blue !important; background: url("/image.svg"); } }\n';
    await writeFile(path.join(root, "parts/b.css"), b);
    await writeFile(path.join(root, "entry.css"), '@import "/parts/a.css";\n@import url(\'./parts/b.css\');\n@import "./parts/a.css";');
    const result = await assembleCss(root, "entry.css");
    assert.equal(result.css, [a, b, a].join("\n\n") + "\n");
  });
});

test("rejects unregistered import-bearing entries", async () => {
  await fixture(async (root) => {
    await checkCssEntryCoverage(root);
    await writeFile(path.join(root, "unregistered.css"), '@import "./parts/a.css";');
    await assert.rejects(() => checkCssEntryCoverage(root), /register/);
  });
});

test("OpsLaundry output matches the established minified bundle", async () => {
  const manifest = await readFile(path.join(ROOT, "ls_styles.css"), "utf8");
  const sources = await Promise.all([...manifest.matchAll(/@import url\("([^\"]+)"\);/g)].map(async ([, file]) => {
    const source = file.startsWith("/") ? path.join(ROOT, file.slice(1)) : path.resolve(ROOT, file);
    return `/* ${file} */\n${await readFile(source, "utf8")}`;
  }));
  const previous = await transform(sources.join("\n"), {loader: "css", minify: true});
  const current = await renderCssBundle(ROOT, CSS_BUNDLES[0]);
  assert.equal(current.css, previous.code);
});

test("contact pages do not reserve an unused scrollbar gutter", async () => {
  const current = await renderCssBundle(ROOT, CSS_BUNDLES[0]);
  assert.match(
    current.css,
    /html:has\(body\.ls-contact-page\),body\.ls-contact-page\{scrollbar-gutter:auto\}/,
  );
});
