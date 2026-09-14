import {readFile, readdir, access} from "node:fs/promises";
import path from "node:path";
import {parse, all, attr, byClass} from "./html-tree.mjs";
import {SITE} from "../site/features/machinery/presentation.mjs";

export async function checkArtifact(dist, report) {
  const root = path.resolve(dist);
  const runtimeSource = await readFile(path.join(root, "static/js/config/runtime-config.js"), "utf8");
  const runtime = JSON.parse(runtimeSource.match(/window\.__OPSLAUNDRY_CONFIG__\s*=\s*(\{[\s\S]*?\})\s*;/u)?.[1] || "null");
  if (!runtime || runtime.FIREBASE_APP_CHECK_DEBUG_TOKEN || runtime.FIREBASE_BUILD_ACCESS_TOKEN) {
    throw new Error("Publication blocked: invalid runtime config or private/debug build credentials in public config");
  }
  const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => match[1]);
  const unique = new Set(urls);
  if (urls.length !== unique.size || urls.length !== 44 + report.generated) throw new Error("Invalid generated sitemap size");
  const checked = new Set();
  async function checkLocalUrl(value, base) {
    if (!value || value.startsWith("#")) return;
    const url = new URL(value, `${SITE}${base}`);
    if (url.origin !== SITE) return;
    const name = decodeURIComponent(url.pathname);
    const file = path.resolve(root, `.${name}`, name.endsWith("/") ? "index.html" : "");
    if (!file.startsWith(`${root}${path.sep}`)) throw new Error("Artifact link escapes output root");
    if (checked.has(file)) return;
    await access(file).catch(() => { throw new Error(`Missing artifact target: ${name} (from ${base})`); });
    checked.add(file);
  }
  let details = 0;
  async function visit(directory) {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) { await visit(file); continue; }
      if (!entry.name.endsWith(".html")) continue;
      const route = `/${path.relative(root, file).split(path.sep).join("/").replace(/index\.html$/u, "")}`;
      const html = await readFile(file, "utf8");
      const tree = parse(html);
      const nodes = all(tree, () => true);
      for (const node of nodes) {
        for (const attribute of ["href", "src"]) {
          const value = attr(node, attribute);
          if (value) await checkLocalUrl(value, route);
        }
      }
      const canonical = nodes.find((node) => node.tagName === "link" && attr(node, "rel") === "canonical");
      if (unique.has(`${SITE}${route}`)) {
        if (attr(canonical, "href") !== `${SITE}${route}`) throw new Error(`Invalid canonical: ${route}`);
        if (nodes.filter((node) => node.tagName === "h1").length !== 1) throw new Error(`Invalid heading count: ${route}`);
        const robots = nodes.find((node) => node.tagName === "meta" && attr(node, "name") === "robots");
        if (/noindex/u.test(attr(robots, "content") || "")) throw new Error(`Sitemap includes noindex page: ${route}`);
        if (!byClass(tree, "footer-brand")) throw new Error(`Missing static footer: ${route}`);
      }
      const detail = nodes.find((node) => attr(node, "data-machine-detail") !== undefined);
      if (detail) {
        details++;
        const json = nodes.find((node) => node.tagName === "script" && attr(node, "type") === "application/ld+json");
        const schema = JSON.parse(json?.childNodes?.[0]?.value || "null");
        if (schema?.["@type"] !== "Product" || schema.url !== `${SITE}${route}` ||
          (schema.offers && (!Number.isFinite(Number(schema.offers.price)) || schema.offers.price === undefined))) {
          throw new Error(`Invalid machine schema: ${route}`);
        }
        if (!unique.has(`${SITE}${route}`)) throw new Error(`Machine missing from sitemap: ${route}`);
      }
    }
  }
  for (const url of urls) await checkLocalUrl(url, "/");
  await visit(root);
  if (details !== report.generated) throw new Error("Generated machinery count differs from the build report");
  console.log(`OK: artefacto con ${urls.length} URLs indexables y ${details} fichas; destinos locales y metadatos verificados.`);
}
