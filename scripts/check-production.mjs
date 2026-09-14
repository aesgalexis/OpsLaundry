import {mkdir, readFile, writeFile} from "node:fs/promises";
import {parse, all, attr} from "./html-tree.mjs";
import {ROUTES, routePath} from "../site/shared/routes.mjs";
import {SITE, machineRoute} from "../site/features/machinery/presentation.mjs";
import {machineMetadata} from "../site/features/machinery/seo.mjs";
import {fetchMachines} from "./generate-machinery-pages.mjs";
import {loadSnapshot, publicMachines} from "./machinery-snapshot.mjs";

// Read-only, bounded public sample. No form submissions or administration writes.
const report = {checkedAt: new Date().toISOString(), pages: [], failures: [], warnings: []};
async function get(route) {
  const response = await fetch(`${SITE}${route}`, {signal: AbortSignal.timeout(15000)});
  if (!response.ok || response.url !== `${SITE}${route}`) throw new Error(`${route}: HTTP ${response.status} or unexpected redirect`);
  return response.text();
}
const nodeText = (node) => node?.nodeName === "#text" ? node.value : (node?.childNodes || []).map(nodeText).join("");
try {
  const configText = await get("/static/js/config/runtime-config.js");
  const config = JSON.parse(configText.match(/window\.__OPSLAUNDRY_CONFIG__\s*=\s*(\{[\s\S]*?\})\s*;/u)?.[1] || "null");
  if (!config?.FIREBASE_PROJECT_ID) throw new Error("Missing public runtime configuration");
  if (config.FIREBASE_APP_CHECK_DEBUG_TOKEN || config.FIREBASE_BUILD_ACCESS_TOKEN) throw new Error("Public debug/private credentials detected");
  const machines = publicMachines(await fetchMachines({projectId: config.FIREBASE_PROJECT_ID, apiKey: config.FIREBASE_API_KEY}));
  const previous = await loadSnapshot(".cache/machinery-snapshot.json", config.FIREBASE_PROJECT_ID);
  const old = new Map((previous?.machines || []).map((machine) => [machine.id, JSON.stringify(machine)]));
  const changed = previous ? machines.filter((machine) => old.get(machine.id) !== JSON.stringify(machine)) : [];
  report.changedMachineIds = changed.map((machine) => machine.id);
  report.removedMachineIds = previous ? previous.machines.filter((oldMachine) => !machines.some((machine) => machine.id === oldMachine.id)).map((machine) => machine.id) : [];
  if (!previous) report.warnings.push("No valid local baseline for real-change comparison");
  const sample = changed[0] || machines[0];
  const sitemap = await get("/sitemap.xml");
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => match[1]);
  const expected = new Set(Object.keys(ROUTES).flatMap((lang) => [
    ...Object.keys(ROUTES[lang]).map((page) => `${SITE}${routePath(lang, page)}`),
    ...machines.map((machine) => `${SITE}${machineRoute(lang, machine.id)}`),
  ]));
  if (urls.length !== expected.size || new Set(urls).size !== urls.length || urls.some((url) => !expected.has(url))) {
    report.failures.push("Published sitemap differs from current visible inventory/routes: rebuild required");
  }
  report.sitemapUrls = urls.length;
  report.visibleMachines = machines.length;
  const robots = await get("/robots.txt");
  if (/^Disallow:\s*\/\s*$/mu.test(robots) || !robots.includes(`${SITE}/sitemap.xml`)) report.failures.push("Invalid robots/sitemap declaration");
  for (const lang of Object.keys(ROUTES)) {
    for (const kind of sample ? ["home", "machine"] : ["home"]) {
      const route = kind === "home" ? routePath(lang, "home") : machineRoute(lang, sample.id);
      const html = await get(route);
      const nodes = all(parse(html), () => true);
      const find = (tag, key, value) => nodes.find((node) => node.tagName === tag && attr(node, key) === value);
      const title = nodeText(nodes.find((node) => node.tagName === "title"));
      const description = attr(find("meta", "name", "description"), "content");
      const canonical = attr(find("link", "rel", "canonical"), "href");
      const h1s = nodes.filter((node) => node.tagName === "h1").length;
      const errors = [];
      if (!title || !description || canonical !== `${SITE}${route}` || h1s !== 1 || attr(nodes.find((node) => node.tagName === "html"), "lang") !== lang) errors.push("head/language/H1");
      if (/noindex/u.test(attr(find("meta", "name", "robots"), "content") || "")) errors.push("noindex");
      for (const alternate of [...Object.keys(ROUTES), "x-default"]) {
        const targetLang = alternate === "x-default" ? "es" : alternate;
        const target = kind === "home" ? routePath(targetLang, "home") : machineRoute(targetLang, sample.id);
        if (attr(find("link", "hreflang", alternate), "href") !== `${SITE}${target}`) errors.push(`hreflang:${alternate}`);
      }
      if (kind === "machine") {
        const copy = JSON.parse(nodeText(find("script", "id", "laundry-machinery-copy")));
        const metadata = machineMetadata(sample, lang, copy);
        const schema = JSON.parse(nodeText(find("script", "type", "application/ld+json")));
        if (JSON.stringify(schema) !== JSON.stringify(metadata.schema) || title !== metadata.title || description !== metadata.description) errors.push("stale machine metadata");
      }
      report.pages.push({route, bytes: Buffer.byteLength(html), ok: errors.length === 0});
      report.failures.push(...errors.map((error) => `${route}: ${error}`));
    }
  }
  for (const route of ["/catalog/", "/requests/"]) {
    const nodes = all(parse(await get(route)), () => true);
    if (!nodes.some((node) => node.tagName === "meta" && attr(node, "name") === "robots" && /noindex/u.test(attr(node, "content") || ""))) report.failures.push(`${route}: missing noindex`);
  }
} catch (error) { report.failures.push(error.message); }
await mkdir(".cache", {recursive: true});
await writeFile(".cache/production-check.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (report.failures.length) process.exitCode = 1;
