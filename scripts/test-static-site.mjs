import assert from "node:assert/strict";
import {test} from "node:test";
import {readFile, readdir} from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";
import {assembleCss, renderCssBundle} from "./css-bundles.mjs";
import {createDocument} from "./test-dom.mjs";
import {renderShell} from "./render-shell.mjs";
import {footerNavigation} from "./shell-navigation.mjs";

async function localizedPages() {
  const result = [];
  for (const lang of ["es", "en", "it", "el"]) {
    for (const file of await readdir(path.join("site", lang), {recursive: true})) {
      if (file.endsWith("index.html")) result.push({lang, file: path.join("site", lang, file),
        route: `/${lang}/${file.replaceAll("\\", "/").replace("index.html", "")}`});
    }
  }
  return result;
}

test("static shell is complete and repeatable across the 44 localized pages", async () => {
  const pages = await localizedPages();
  assert.equal(pages.length, 44);
  for (const {lang, file, route} of pages) {
    const html = await readFile(file, "utf8");
    const doc = createDocument(html);
    assert.ok(renderShell(html, route).replaceAll("\r\n", "\n") === html.replaceAll("\r\n", "\n"), `${route}: shell must be up to date`);
    assert.equal(doc.querySelector(".topbar-logo").classList.contains("topbar-logo--wordmark"), true);
    assert.equal(doc.querySelector(".topbar-brand").href, `/${lang}/`);
    assert.equal(doc.querySelector(".footer-disclosure-panel").hidden, false);
    assert.equal(doc.querySelectorAll(".footer-brand").length, 1);
    assert.equal(doc.querySelectorAll(".footer-about-title").length, 1);
    assert.equal(doc.querySelectorAll(".upperfooter").length, 1);
    assert.deepEqual(doc.querySelectorAll(".upperfooter-list a").map((link) => [link.textContent, link.href]), footerNavigation[lang].items);
    assert.equal(doc.querySelector(".footer-about-title a").getAttribute("aria-current"), route === doc.querySelector(".footer-about-title a").href ? "page" : null);
    assert.equal(doc.querySelector(".footer-disclosure-toggle"), null);
    assert.equal(doc.querySelector("#upperfooter-mount"), null);
    const charset = html.match(/<meta charset="UTF-8">/u);
    assert.ok(charset && Buffer.byteLength(html.slice(0, charset.index + charset[0].length)) <= 1024);
  }
});

test("public CSS retains the exact common declarations and their original cascade order", async () => {
  const full = await assembleCss("site", "styles/site.css");
  const publicCss = await assembleCss("site", "styles/site-public.css");
  const machinery = await readFile("site/styles/machinery.css", "utf8");
  const rules = (css) => {
    const root = postcss.parse(css);
    root.walkComments((comment) => comment.remove());
    return root.nodes.map((node) => node.toString().replace(/\s+/gu, " "));
  };
  assert.deepEqual(rules(publicCss.css), rules(full.css.replace(machinery, "")));
  const fullMinified = await renderCssBundle("site", {entry: "styles/site.css", minify: true});
  const publicMinified = await renderCssBundle("site", {entry: "styles/site-public.css", minify: true});
  assert.ok(Buffer.byteLength(publicMinified.css) < Buffer.byteLength(fullMinified.css));
  // Leading class anchors from every machinery selector must be absent in other pages.
  const anchors = new Set();
  postcss.parse(machinery).walkRules((rule) => {
    for (const selector of rule.selectors) {
      const anchor = selector.trim().match(/^\.([\w-]+)/u)?.[1];
      assert.ok(anchor, `Review unanchored machinery selector: ${selector}`);
      anchors.add(anchor);
    }
  });
  for (const {file, route} of await localizedPages()) {
    const doc = createDocument(await readFile(file, "utf8"));
    if (["machinery-page", "spares-page"].some((name) => doc.querySelector("body").classList.contains(name))) {
      assert.equal(doc.querySelector('link[rel="stylesheet"]').href, "/styles/site.css");
    } else {
      assert.equal(doc.querySelector('link[rel="stylesheet"]').href, "/styles/site-public.css");
      for (const anchor of anchors) assert.ok(!doc.querySelector(`.${anchor}`), `${route}: requires machinery styles for ${anchor}`);
    }
  }
});

test("administration and legacy aliases rely on crawlable noindex HTML", async () => {
  const robots = await readFile("site/robots.txt", "utf8");
  assert.ok(!/^Disallow:\s*\/\s*$/mu.test(robots));
  for (const name of ["catalog", "requests"]) {
    const doc = createDocument(await readFile(path.join("site", name, "index.html"), "utf8"));
    assert.match(doc.querySelector('meta[name="robots"]').content, /noindex/u);
  }
  for (const name of ["catalog", "requests", "catalogo", "solicitudes"]) {
    assert.ok(!robots.includes(`Disallow: /${name}`));
  }
});
