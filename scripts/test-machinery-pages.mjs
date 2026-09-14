import assert from "node:assert/strict";
import {test} from "node:test";
import {mkdtemp, mkdir, cp, readFile, writeFile, rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {generateMachineryPages} from "./generate-machinery-pages.mjs";
import {loadSnapshot, saveSnapshot, MAX_SNAPSHOT_AGE} from "./machinery-snapshot.mjs";
import {assertPublishable} from "./check-publish.mjs";
import {LOCALES, formatPrice, warrantyText, capacity} from "../site/features/machinery/presentation.mjs";
import {machineMetadata, updateMachineMetadata} from "../site/features/machinery/seo.mjs";
import {createDocument} from "./test-dom.mjs";

const NOW = Date.UTC(2026, 8, 13);
const machine = {id: "L001", categoria: "lavadora", marca: "Example", modelo: "Washer 50 kg",
  precioAmount: 12500, visible: true, imagenes: [{url: "https://example.com/machine.webp", path: "private-path"}],
  comentarios: 'Example <text> & </script> $&', createdBy: "private-person", privateNotes: "not public"};
const unavailable = async () => { throw new Error("Offline"); };

async function fixture(run) {
  const folder = await mkdtemp(path.join(os.tmpdir(), "opslaundry-machinery-test-"));
  const root = path.join(folder, "site");
  const dist = path.join(folder, "dist");
  const cacheFile = path.join(folder, "cache.json");
  await mkdir(path.join(root, "static/js/config"), {recursive: true});
  await writeFile(path.join(root, "static/js/config/runtime-config.js"), 'window.__OPSLAUNDRY_CONFIG__ = {"FIREBASE_PROJECT_ID":"test-project"};');
  const reset = async () => {
    assert.equal(path.dirname(dist), folder);
    await rm(dist, {recursive: true, force: true});
    for (const [lang, locale] of Object.entries(LOCALES)) {
      const dest = path.join(dist, lang, locale.route);
      await mkdir(dest, {recursive: true});
      await cp(path.join("site", lang, locale.route, "index.html"), path.join(dest, "index.html"));
    }
    await cp("site/sitemap.xml", path.join(dist, "sitemap.xml"));
  };
  const generate = async (fetcher, now = NOW) => {
    await reset();
    return generateMachineryPages({root, dist, cacheFile, fetcher, now});
  };
  try { await run({root, dist, cacheFile, generate}); }
  finally {
    assert.equal(path.dirname(folder), os.tmpdir());
    await rm(folder, {recursive: true, force: true});
  }
}

test("build creates all localized fiches and recovers them with current templates when Firestore fails", async () => {
  await fixture(async ({dist, cacheFile, generate}) => {
    const fresh = await generate(async () => [machine, {...machine, id: "H002", visible: false}]);
    assert.deepEqual(fresh, {status: "fresh", fetchedAt: NOW, generated: 4, machines: 1});
    assertPublishable(fresh, NOW);
    const cache = await readFile(cacheFile, "utf8");
    for (const privateValue of ["private-person", "privateNotes", "private-path", "H002"]) assert.ok(!cache.includes(privateValue));
    for (const [lang, locale] of Object.entries(LOCALES)) {
      const html = await readFile(path.join(dist, lang, locale.route, machine.id, "index.html"), "utf8");
      const doc = createDocument(html);
      assert.equal(doc.querySelector('link[rel="canonical"]').href, `https://opslaundry.com/${lang}/${locale.route}/${machine.id}/`);
      assert.equal(doc.querySelector('meta[property="og:image:width"]'), null);
      assert.equal(doc.querySelector('meta[property="og:image:height"]'), null);
      assert.equal(doc.querySelector('meta[property="og:image"]').content, machine.imagenes[0].url);
      assert.equal(doc.querySelectorAll('link[hreflang]').length, 5);
      assert.equal(doc.querySelectorAll("h1").length, 1);
      assert.ok(doc.querySelector("body").classList.contains("machine-detail-page"));
      assert.equal(doc.querySelector('meta[name="description"]').content, machine.comentarios);
      assert.equal(doc.querySelector(".upperfooter-list").querySelectorAll("a")[3].href, `/${lang}/${locale.route}/`);
      assert.equal(JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent).offers.price, "12500");
      assert.ok(html.includes('\\u003c/script>'));
      const listing = await readFile(path.join(dist, lang, locale.route, "index.html"), "utf8");
      assert.ok(listing.includes('data-prerendered="true"'));
      assert.ok(listing.includes('data-static-machine-pages="true"'));
    }
    const cached = await generate(unavailable, NOW + 1000);
    assert.equal(cached.status, "cached");
    assert.equal(cached.fetchedAt, NOW);
    assert.equal(cached.generated, 4);
    assertPublishable(cached, NOW + 1000);
    assert.equal(await readFile(cacheFile, "utf8"), cache, "fallback never renews the snapshot date");
    const sitemap = await readFile(path.join(dist, "sitemap.xml"), "utf8");
    assert.equal((sitemap.match(/L001/g) || []).length, 4);
    const expired = await generate(unavailable, NOW + MAX_SNAPSHOT_AGE + 1);
    assert.equal(expired.status, "unavailable");
    assert.throws(() => assertPublishable(expired, NOW + MAX_SNAPSHOT_AGE + 1), /bloqueada/);
  });
});

test("no cache blocks publishing; a successful empty result clears previously generated machines", async () => {
  await fixture(async ({generate, dist}) => {
    assert.throws(() => assertPublishable({}), /bloqueada/);
    assert.equal((await generate(unavailable)).status, "unavailable");
    await generate(async () => [machine]);
    const empty = await generate(async () => []);
    assertPublishable(empty, NOW);
    assert.equal(empty.generated, 0);
    assert.equal(empty.machines, 0);
    assert.ok(!(await readFile(path.join(dist, "sitemap.xml"), "utf8")).includes("L001"));
    await assert.rejects(readFile(path.join(dist, "es", LOCALES.es.route, machine.id, "index.html")));
    const cached = await generate(unavailable, NOW + 1000);
    assert.equal(cached.status, "cached");
    assert.equal(cached.machines, 0);
  });
});

test("snapshot validates project, age and integrity, and rejects unsafe or duplicate paths", async () => {
  await fixture(async ({cacheFile}) => {
    await saveSnapshot(cacheFile, "test-project", [machine], NOW);
    assert.equal(await loadSnapshot(cacheFile, "other-project", NOW), null);
    assert.equal(await loadSnapshot(cacheFile, "test-project", NOW - 1), null);
    assert.equal(await loadSnapshot(cacheFile, "test-project", NOW + MAX_SNAPSHOT_AGE + 1), null);
    const data = JSON.parse(await readFile(cacheFile, "utf8"));
    await writeFile(cacheFile, JSON.stringify({...data, version: 1}));
    assert.equal(await loadSnapshot(cacheFile, "test-project", NOW), null, "pre-migration caches are rejected");
    data.machines[0].precioAmount = 1;
    await writeFile(cacheFile, JSON.stringify(data));
    assert.equal(await loadSnapshot(cacheFile, "test-project", NOW), null);
    await assert.rejects(saveSnapshot(cacheFile, "test-project", [{...machine, id: "../escape"}], NOW));
    await assert.rejects(saveSnapshot(cacheFile, "test-project", [machine, machine], NOW));
  });
});

test("live metadata follows changes, removes obsolete offers and handles withdrawal/reactivation", () => {
  const doc = createDocument('<html><head><title>Old</title><meta name="robots" content="index, follow"><meta property="og:image:width" content="512"><script type="application/ld+json">{}</script></head><body></body></html>');
  const copy = {typeLabels: {lavadora: "Washer"}};
  updateMachineMetadata(doc, machine, "en", copy);
  assert.deepEqual(JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent), machineMetadata(machine, "en", copy).schema);
  assert.equal(doc.querySelector('meta[property="og:image:width"]'), null);
  updateMachineMetadata(doc, {...machine, precioAmount: null, imagenes: [], modelo: "New model"}, "en", copy);
  assert.equal(doc.title, "Example New model | OpsLaundry");
  assert.equal(doc.querySelector('meta[property="og:image"]'), null);
  assert.equal(JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent).offers, undefined);
  updateMachineMetadata(doc, null, "en", copy);
  assert.equal(doc.querySelector('script[type="application/ld+json"]'), null);
  assert.equal(doc.querySelector('meta[name="robots"]').content, "noindex, follow");
  updateMachineMetadata(doc, {...machine, precioAmount: 0}, "en", copy);
  assert.equal(doc.querySelector('meta[name="robots"]').content, "index, follow");
  assert.equal(JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent).offers.price, "0");
});

test("shared presentation preserves quote labels, capacity and warranty precedence", () => {
  const labels = {consult: "Consultar", fullWarrantyMonths: "Total {n} months", partsWarrantyMonths: "Parts {n} months",
    fullWarrantyOne: "Total 1 year", fullWarrantyMany: "Total {n} years", partsWarrantyOne: "Parts 1 year", partsWarrantyMany: "Parts {n} years"};
  assert.equal(formatPrice(machine, labels), "12.500 EUR");
  assert.equal(formatPrice({precioTexto: " CONSULTAR "}, labels), "Consultar");
  assert.equal(formatPrice({precioAmount: 0}, labels), "0 EUR");
  assert.equal(capacity(machine), "50 kg");
  assert.equal(capacity({...machine, capacidad: "80 kg"}), "80 kg");
  assert.equal(warrantyText({garantiaTipo: "total", garantiaMeses: 6, garantiaPiezasAnos: 2}, labels), "Total 6 months");
  assert.equal(warrantyText({garantiaPiezasAnos: 1}, labels), "Parts 1 year");
});
