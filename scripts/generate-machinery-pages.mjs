import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";

const SITE = "https://opslaundry.com";
const COLLECTION = "agregador_maquinaria_LS";
const PAGE_SIZE = 20;
const PREFIX_ORDER = ["P", "T", "L", "S", "C", "R", "M"];
const LOCALES = {
  es: {route: "maquinaria-ocasion", locale: "es_ES", back: "Volver al listado", contact: "Contactar", description: "Maquinaria de ocasión disponible en OpsLaundry."},
  en: {route: "used-machinery", locale: "en_GB", back: "Back to the list", contact: "Contact", description: "Used machinery available from OpsLaundry."},
  it: {route: "macchinari-usati", locale: "it_IT", back: "Torna all'elenco", contact: "Contatta", description: "Macchinario usato disponibile presso OpsLaundry."},
  el: {route: "metacheirismena-michanimata", locale: "el_GR", back: "Επιστροφή στη λίστα", contact: "Επικοινωνία", description: "Μεταχειρισμένο μηχάνημα διαθέσιμο από την OpsLaundry."},
};

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const decodeFirestoreValue = (value = {}) => {
  if ("nullValue" in value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(decodeFirestoreValue);
  if ("mapValue" in value) return Object.fromEntries(
    Object.entries(value.mapValue.fields || {}).map(([key, item]) => [key, decodeFirestoreValue(item)])
  );
  return null;
};

const decodeDocument = (document) => {
  const fields = Object.fromEntries(
    Object.entries(document.fields || {}).map(([key, value]) => [key, decodeFirestoreValue(value)])
  );
  return {...fields, docId: document.name?.split("/").pop() || ""};
};

const loadRuntimeConfig = async (root) => {
  const source = await readFile(path.join(root, "static", "js", "config", "runtime-config.js"), "utf8");
  const match = source.match(/window\.__OPSLAUNDRY_CONFIG__\s*=\s*(\{[\s\S]*?\})\s*;/u);
  return match ? JSON.parse(match[1]) : {};
};

const fetchMachines = async ({projectId, apiKey}) => {
  const machines = [];
  let pageToken = "";
  do {
    const endpoint = new URL(
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${COLLECTION}`
    );
    endpoint.searchParams.set("pageSize", "1000");
    if (apiKey) endpoint.searchParams.set("key", apiKey);
    if (pageToken) endpoint.searchParams.set("pageToken", pageToken);
    const response = await fetch(endpoint, {signal: AbortSignal.timeout(12000)});
    if (!response.ok) throw new Error(`Firestore respondió ${response.status}`);
    const payload = await response.json();
    machines.push(...(payload.documents || []).map(decodeDocument));
    pageToken = payload.nextPageToken || "";
  } while (pageToken);
  return machines
    .map((machine) => ({
      ...machine,
      id: String(machine.id || machine.docId || "").trim(),
      envioIncluido: machine.envioIncluido !== false,
      puestaEnMarchaIncluida: machine.puestaEnMarchaIncluida !== false,
      imagenes: Array.isArray(machine.imagenes) ? machine.imagenes : [],
    }))
    .filter((machine) => machine.visible !== false && machine.id && machine.categoria && machine.marca);
};

const safeMachineId = (value) => /^[A-Za-z0-9_-]+$/u.test(value) ? value : "";
const normalizeKey = (value) => String(value || "").trim().toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/gu, "").replace(/[^a-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "");
const imageUrl = (image) => typeof image === "string" ? image : image?.url || "";
const publicImageUrl = (image) => {
  const url = imageUrl(image);
  return /^https?:\/\//iu.test(url) ? url : "";
};
const capacity = (machine) => machine.capacidad || String(machine.modelo || "").match(/\b\d+(?:[.,]\d+)?\s*(?:kg|kgs|l|lt|lts)\b/iu)?.[0] || "";
const formatPrice = (machine, labels) => {
  if (typeof machine.precioAmount === "number" && Number.isFinite(machine.precioAmount)) {
    return `${Math.round(machine.precioAmount).toString().replace(/\B(?=(\d{3})+(?!\d))/gu, ".")} EUR`;
  }
  return String(machine.precioTexto || "").trim().toLowerCase() === "consultar"
    ? labels.consult
    : machine.precioTexto || "";
};

const warrantyText = (machine, labels) => {
  const months = Number.parseInt(machine.garantiaMeses, 10);
  const years = Number.parseInt(machine.garantiaPiezasAnos, 10);
  const total = String(machine.garantiaTipo || "").trim() === "total";
  if (Number.isFinite(months) && months > 0) {
    return (total ? labels.fullWarrantyMonths : labels.partsWarrantyMonths).replace("{n}", months);
  }
  if (Number.isFinite(years) && years > 0) {
    if (total) return years === 1 ? labels.fullWarrantyOne : labels.fullWarrantyMany.replace("{n}", years);
    return years === 1 ? labels.partsWarrantyOne : labels.partsWarrantyMany.replace("{n}", years);
  }
  return machine.garantiaTexto || "";
};

const extrasText = (machine, labels) => {
  const extras = [];
  if (machine.envioIncluido && machine.puestaEnMarchaIncluida) extras.push(labels.shippingStartup);
  else if (machine.envioIncluido) extras.push(labels.shippingOnly);
  else if (machine.puestaEnMarchaIncluida) extras.push(labels.startupOnly);
  const warranty = warrantyText(machine, labels);
  if (warranty) extras.push(warranty);
  return extras.length ? ` · ${extras.join(" · ")}` : "";
};

const sortMachines = (machines) => [...machines].sort((a, b) => {
  const prefixA = PREFIX_ORDER.indexOf(a.id.charAt(0).toUpperCase());
  const prefixB = PREFIX_ORDER.indexOf(b.id.charAt(0).toUpperCase());
  const rankA = prefixA === -1 ? PREFIX_ORDER.length : prefixA;
  const rankB = prefixB === -1 ? PREFIX_ORDER.length : prefixB;
  const sequenceA = Number.parseInt(a.id.match(/\d+/u)?.[0] || "0", 10);
  const sequenceB = Number.parseInt(b.id.match(/\d+/u)?.[0] || "0", 10);
  return rankA - rankB || sequenceA - sequenceB || a.id.localeCompare(b.id);
});

const parseCopy = (html) => {
  const match = html.match(/<script type="application\/json" id="laundry-machinery-copy">([\s\S]*?)<\/script>/u);
  return match ? JSON.parse(match[1]) : null;
};

const machineRoute = (lang, id) => `/${lang}/${LOCALES[lang].route}/${encodeURIComponent(id)}/`;
const contactHref = (machine, copy, type) => {
  const params = new URLSearchParams({
    subject: "investment", type, brand: machine.marca || "", model: machine.modelo || "",
    year: machine.anio == null ? "" : String(machine.anio), id: machine.id,
  });
  return `${copy.contactPath}?${params.toString()}`;
};

const renderListRows = (machines, lang, copy) => machines.slice(0, PAGE_SIZE).map((machine) => {
  const labels = copy.labels;
  const type = copy.typeLabels[normalizeKey(machine.categoria)] || machine.categoria;
  const state = copy.stateLabels[normalizeKey(machine.estado)] || machine.estado || "";
  const href = machineRoute(lang, machine.id);
  const heating = machine.calefaccion
    ? copy.heatingLabels[normalizeKey(machine.calefaccion)] || machine.calefaccion
    : "";
  const comments = machine.comentarios || "";
  const images = (Array.isArray(machine.imagenes) ? machine.imagenes : []).map(publicImageUrl).filter(Boolean);
  return `<tr data-machine-id="${escapeHtml(machine.id)}">
    <td data-type="${escapeHtml(type)}" data-label="${escapeHtml(labels.type)}">${escapeHtml(type)}</td>
    <td data-label="${escapeHtml(labels.brand)}">${escapeHtml(machine.marca)}</td>
    <td data-label="${escapeHtml(labels.model)}">${escapeHtml(machine.modelo)}</td>
    <td data-label="${escapeHtml(labels.capacity)}">${escapeHtml(capacity(machine))}</td>
    <td data-label="${escapeHtml(labels.year)}">${escapeHtml(machine.anio ?? "")}</td>
    <td data-label="${escapeHtml(labels.status)}">${escapeHtml(state)}</td>
    <td data-label="${escapeHtml(labels.location)}">${escapeHtml(machine.ubicacion || "")}</td>
  </tr>
  <tr class="table-subrow${images.length ? " table-subrow-has-gallery" : ""}"><td colspan="7">
    ${comments ? `<div class="table-meta table-comment">${escapeHtml(comments)}</div>` : ""}
    ${heating ? `<div class="table-meta"><strong>${escapeHtml(labels.heating)}</strong> ${escapeHtml(heating)}</div>` : ""}
    <div class="table-subrow-inner">
      <div><strong>${escapeHtml(labels.price)}</strong> <span class="price">${escapeHtml(formatPrice(machine, labels))}</span>${escapeHtml(extrasText(machine, labels))} | <strong>${escapeHtml(labels.id)}</strong> <a class="machine-link" href="${escapeHtml(href)}">${escapeHtml(machine.id)}</a></div>
      <div class="table-actions">
        ${images.length ? `<button type="button" class="mini-action gallery-toggle" data-gallery-id="${escapeHtml(machine.id)}" aria-expanded="false" aria-controls="gallery-${escapeHtml(machine.id)}"><span class="mini-action-label">${escapeHtml(labels.photos)}</span></button>` : ""}
        <a class="mini-action" href="${escapeHtml(href)}"><span class="mini-action-label">${escapeHtml(labels.info)}</span></a>
      </div>
    </div>
  </td></tr>
  ${images.length ? `<tr id="gallery-${escapeHtml(machine.id)}" class="table-gallery-row" data-gallery-id="${escapeHtml(machine.id)}" data-gallery-open="false" hidden><td colspan="7"><div class="machine-gallery" aria-label="${escapeHtml(`${labels.gallery} ${machine.id}`)}">${images.map((url, index) => `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(url)}" alt="${escapeHtml(`${machine.id} ${labels.image} ${index + 1}`)}" loading="lazy"></a>`).join("")}</div></td></tr>` : ""}`;
}).join("\n");

const detailSchema = (machine, lang, copy) => {
  const url = `${SITE}${machineRoute(lang, machine.id)}`;
  const images = (Array.isArray(machine.imagenes) ? machine.imagenes : []).map(publicImageUrl).filter(Boolean);
  const schema = {
    "@context": "https://schema.org", "@type": "Product", "@id": `${url}#product`,
    name: `${machine.marca} ${machine.modelo}`.trim(), url, sku: machine.id,
    description: machine.comentarios || LOCALES[lang].description,
    category: copy.typeLabels[normalizeKey(machine.categoria)] || machine.categoria,
    itemCondition: "https://schema.org/UsedCondition",
    brand: {"@type": "Brand", name: machine.marca},
  };
  if (machine.modelo) schema.model = machine.modelo;
  if (images.length) schema.image = images;
  schema.offers = {
    "@type": "Offer", availability: "https://schema.org/InStock", priceCurrency: "EUR",
    url,
  };
  if (typeof machine.precioAmount === "number" && machine.precioAmount >= 0) {
    schema.offers.price = String(machine.precioAmount);
  }
  return JSON.stringify(schema).replaceAll("<", "\\u003c");
};

const replaceHeadMetadata = (html, machine, lang, copy) => {
  const title = `${machine.marca} ${machine.modelo} | OpsLaundry`.trim();
  const description = String(machine.comentarios || `${LOCALES[lang].description} ${machine.marca} ${machine.modelo}.`).slice(0, 160);
  const canonical = `${SITE}${machineRoute(lang, machine.id)}`;
  const images = (Array.isArray(machine.imagenes) ? machine.imagenes : []).map(publicImageUrl).filter(Boolean);
  html = html.replace(/<title>[\s\S]*?<\/title>/u, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/u, `<meta name="description" content="${escapeHtml(description)}">`);
  html = html.replace(/<link rel="canonical" href="[^"]*">/u, `<link rel="canonical" href="${escapeHtml(canonical)}">`);
  html = html.replace(/<meta property="og:type" content="[^"]*">/u, '<meta property="og:type" content="product">');
  html = html.replace(/<meta property="og:title" content="[^"]*">/u, `<meta property="og:title" content="${escapeHtml(title)}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/u, `<meta property="og:description" content="${escapeHtml(description)}">`);
  html = html.replace(/<meta property="og:url" content="[^"]*">/u, `<meta property="og:url" content="${escapeHtml(canonical)}">`);
  if (images[0]) {
    html = html.replace(/<meta property="og:image" content="[^"]*">/u, `<meta property="og:image" content="${escapeHtml(images[0])}">`);
    html = html.replace(/<meta property="og:image:alt" content="[^"]*">/u, `<meta property="og:image:alt" content="${escapeHtml(`${machine.marca} ${machine.modelo}`.trim())}">`);
  }
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/u, `<script type="application/ld+json">${detailSchema(machine, lang, copy)}</script>`);
  for (const targetLang of Object.keys(LOCALES)) {
    html = html.replace(
      new RegExp(`<link rel="alternate" hreflang="${targetLang}" href="[^"]*">`, "u"),
      `<link rel="alternate" hreflang="${targetLang}" href="${SITE}${machineRoute(targetLang, machine.id)}">`
    );
  }
  html = html.replace(/<link rel="alternate" hreflang="x-default" href="[^"]*">/u,
    `<link rel="alternate" hreflang="x-default" href="${SITE}${machineRoute("es", machine.id)}">`);
  return html;
};

const renderDetail = (machine, lang, copy) => {
  const labels = copy.labels;
  const type = copy.typeLabels[normalizeKey(machine.categoria)] || machine.categoria;
  const state = copy.stateLabels[normalizeKey(machine.estado)] || machine.estado || "";
  const images = (Array.isArray(machine.imagenes) ? machine.imagenes : []).map(publicImageUrl).filter(Boolean);
  const heating = machine.calefaccion
    ? copy.heatingLabels[normalizeKey(machine.calefaccion)] || machine.calefaccion
    : "";
  const specs = [
    ["type", labels.type, type], ["brand", labels.brand, machine.marca], ["model", labels.model, machine.modelo],
    ["capacity", labels.capacity, capacity(machine)], ["year", labels.year, machine.anio ?? ""],
    ["status", labels.status, state], ["location", labels.location, machine.ubicacion || ""],
    ["heating", labels.heating, heating],
  ].filter(([, , value]) => String(value).trim());
  return `<article class="legal-copy machine-detail" data-machine-detail data-machine-id="${escapeHtml(machine.id)}">
    <header class="machine-detail-heading">
      <p class="machine-detail-kicker">${escapeHtml(type)} · ${escapeHtml(machine.id)}</p>
      <h1>${escapeHtml(`${machine.marca} ${machine.modelo}`.trim())}</h1>
    </header>
    <p class="machine-detail-status" data-machine-status role="status" hidden></p>
    <section class="card card--wide machine-detail-card">
      <dl class="machine-specs">${specs.map(([key, label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd data-machine-field="${key}">${escapeHtml(value)}</dd></div>`).join("")}</dl>
      <p class="machine-detail-price"><strong>${escapeHtml(labels.price)}</strong> <span class="price" data-machine-price>${escapeHtml(formatPrice(machine, labels))}</span><span data-machine-extras>${escapeHtml(extrasText(machine, labels))}</span></p>
      ${machine.comentarios ? `<p class="machine-detail-copy" data-machine-comments>${escapeHtml(machine.comentarios)}</p>` : '<p class="machine-detail-copy" data-machine-comments hidden></p>'}
      <div class="machine-detail-gallery" data-machine-gallery>${images.map((url, index) => `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(url)}" alt="${escapeHtml(`${machine.id} ${labels.image} ${index + 1}`)}" loading="lazy"></a>`).join("")}</div>
      <div class="machine-detail-actions">
        <a class="mini-action" data-machine-contact href="${escapeHtml(contactHref(machine, copy, type))}">${escapeHtml(LOCALES[lang].contact)}</a>
        <a class="mini-action" href="/${lang}/${LOCALES[lang].route}/">${escapeHtml(LOCALES[lang].back)}</a>
      </div>
    </section>
  </article>`;
};

const generateDetailPage = (template, machine, lang, copy) => {
  let html = replaceHeadMetadata(template, machine, lang, copy);
  for (const targetLang of Object.keys(LOCALES)) {
    const base = `/${targetLang}/${LOCALES[targetLang].route}/`;
    html = html.replace(new RegExp(`href="${base.replaceAll("/", "\\/")}"`, "gu"), `href="${machineRoute(targetLang, machine.id)}"`);
  }
  html = html.replace(/<article class="legal-copy">[\s\S]*?<\/article>/u, renderDetail(machine, lang, copy));
  html = html.replace('<body class="page privacy-page machinery-page"', '<body class="page privacy-page machinery-page machine-detail-page"');
  html = html.replace('<script type="module" src="/features/machinery/list.js"></script>', '<script type="module" src="/features/machinery/detail.js"></script>');
  return html;
};

const injectListSnapshot = (html, rows, totalPages, copy) => html
  .replace('<body class="page privacy-page machinery-page"', '<body data-static-machine-pages="true" class="page privacy-page machinery-page"')
  .replace(/<tbody(?:\s[^>]*)?>\s*<\/tbody>/u, `<tbody data-prerendered="true" aria-live="polite">${rows}</tbody>`)
  .replace(/(<span class="pagination-status"[^>]*>)[\s\S]*?(<\/span>)/u,
    `$1${escapeHtml(copy.labels.page.replace("{current}", "1").replace("{total}", String(totalPages)))}$2`);

const appendSitemapUrls = async (dist, machines) => {
  const filename = path.join(dist, "sitemap.xml");
  let sitemap = await readFile(filename, "utf8");
  const urls = machines.flatMap((machine) => Object.keys(LOCALES).map((lang) => `  <url><loc>${SITE}${machineRoute(lang, machine.id)}</loc></url>`)).join("\n");
  sitemap = sitemap.replace("</urlset>", `${urls ? `${urls}\n` : ""}</urlset>`);
  await writeFile(filename, sitemap, "utf8");
};

export const generateMachineryPages = async ({root, dist}) => {
  let config;
  try {
    config = await loadRuntimeConfig(root);
  } catch {
    console.warn("Snapshot de OpsLaundry omitido: no se pudo leer runtime-config.js.");
    return {generated: 0, machines: 0};
  }
  if (!config.FIREBASE_PROJECT_ID || /your_project/iu.test(config.FIREBASE_PROJECT_ID)) {
    console.warn("Snapshot de OpsLaundry omitido: FIREBASE_PROJECT_ID no está configurado.");
    return {generated: 0, machines: 0};
  }
  let machines;
  try {
    machines = await fetchMachines({projectId: config.FIREBASE_PROJECT_ID, apiKey: config.FIREBASE_API_KEY});
  } catch (error) {
    console.warn(`Snapshot de OpsLaundry omitido sin interrumpir el build: ${error.message}`);
    return {generated: 0, machines: 0};
  }
  machines = sortMachines(machines.filter((machine) => safeMachineId(machine.id)));
  if (!machines.length) {
    console.warn("Snapshot de OpsLaundry omitido: Firestore no devolvió máquinas públicas visibles.");
    return {generated: 0, machines: 0};
  }
  let generated = 0;
  for (const [lang, locale] of Object.entries(LOCALES)) {
    const listPath = path.join(dist, lang, locale.route, "index.html");
    const template = await readFile(listPath, "utf8");
    const copy = parseCopy(template);
    if (!copy) throw new Error(`Falta laundry-machinery-copy en ${lang}.`);
    const listSnapshot = injectListSnapshot(
      template,
      renderListRows(machines, lang, copy),
      Math.max(1, Math.ceil(machines.length / PAGE_SIZE)),
      copy
    );
    if (!listSnapshot.includes('data-prerendered="true"')) {
      throw new Error(`No se pudo insertar el listado prerenderizado en ${lang}.`);
    }
    await writeFile(listPath, listSnapshot, "utf8");
    for (const machine of machines) {
      const output = path.join(dist, lang, locale.route, machine.id, "index.html");
      await mkdir(path.dirname(output), {recursive: true});
      const detailPage = generateDetailPage(template, machine, lang, copy);
      if (!detailPage.includes(`data-machine-id="${escapeHtml(machine.id)}"`) ||
          !detailPage.includes(`href="/${lang}/${locale.route}/">${escapeHtml(locale.back)}</a>`)) {
        throw new Error(`La ficha ${lang}/${machine.id} no conserva sus destinos esperados.`);
      }
      await writeFile(output, detailPage, "utf8");
      generated += 1;
    }
  }
  await appendSitemapUrls(dist, machines);
  console.log(`OpsLaundry snapshot: ${machines.length} máquinas visibles y ${generated} fichas HTML.`);
  return {generated, machines: machines.length};
};
