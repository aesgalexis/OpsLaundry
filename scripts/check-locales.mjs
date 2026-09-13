import {access, readFile} from "node:fs/promises";
import path from "node:path";
import parse5 from "parse5";

const SITE = "https://opslaundry.com";
const LANGS = ["es", "en", "it", "el"];
const ROUTES = {
  es: {about: "nosotros", submission: "enviar-maquina", home: "", audit: "auditoria", support: "asistencia-tecnica", investments: "inversiones", automation: "automatizacion", machinery: "maquinaria-ocasion", spares: "recambios", contact: "contacto", privacy: "privacidad"},
  en: {about: "about-us", submission: "submit-machine", home: "", audit: "technical-audit", support: "technical-support", investments: "investments", automation: "automation", machinery: "used-machinery", spares: "spare-parts", contact: "contact", privacy: "privacy"},
  it: {about: "chi-siamo", submission: "invia-macchina", home: "", audit: "audit-tecnico", support: "assistenza-tecnica", investments: "investimenti", automation: "automazione", machinery: "macchinari-usati", spares: "ricambi", contact: "contatto", privacy: "privacy"},
  el: {about: "poioi-eimaste", submission: "ypovoli-michanimatos", home: "", audit: "technikos-elegchos", support: "techniki-ypostirixi", investments: "ependyseis", automation: "aftomatismoi", machinery: "metacheirismena-michanimata", spares: "antallaktika", contact: "epikoinonia", privacy: "aporrito"},
};
const SECTION_LABELS = {
  es: {about: "Nosotros", submission: "Enviar máquina", audit: "Auditoría", support: "Asistencia técnica", investments: "Inversiones", automation: "Automatización", machinery: "Maquinaria de ocasión", spares: "Recambios", contact: "Contacto", privacy: "Privacidad"},
  en: {about: "About us", submission: "Submit machine", audit: "Technical audit", support: "Technical support", investments: "Investments", automation: "Automation", machinery: "Used machinery", spares: "Spare parts", contact: "Contact", privacy: "Privacy"},
  it: {about: "Chi siamo", submission: "Invia macchina", audit: "Audit tecnico", support: "Assistenza tecnica", investments: "Investimenti", automation: "Automazione", machinery: "Macchinari usati", spares: "Ricambi", contact: "Contatto", privacy: "Privacy"},
  el: {about: "Ποιοι είμαστε", submission: "Υποβολή μηχανήματος", audit: "Τεχνικός έλεγχος", support: "Τεχνική υποστήριξη", investments: "Επενδύσεις", automation: "Αυτοματισμοί", machinery: "Μεταχειρισμένα μηχανήματα", spares: "Ανταλλακτικά", contact: "Επικοινωνία", privacy: "Απόρρητο"},
};
const routePath = (lang, page) => `/${lang}/${ROUTES[lang][page] ? `${ROUTES[lang][page]}/` : ""}`;
const failures = [];
const titles = new Set();
const walk = (node, callback) => {
  callback(node);
  for (const child of node.childNodes || []) walk(child, callback);
};
const findAll = (root, predicate) => {
  const matches = [];
  walk(root, (node) => { if (predicate(node)) matches.push(node); });
  return matches;
};
const attribute = (node, name) => node.attrs?.find((item) => item.name === name)?.value;
const nodeText = (node) => node?.nodeName === "#text" ? node.value || "" : (node?.childNodes || []).map(nodeText).join("");
const hasClass = (node, name) => (attribute(node, "class") || "").split(/\s+/u).includes(name);

for (const lang of LANGS) {
  for (const page of Object.keys(ROUTES[lang])) {
    const route = routePath(lang, page);
    const filename = path.resolve("site", `.${route}`, "index.html");
    try {
      await access(filename);
    } catch {
      failures.push(`${route}: missing index.html.`);
      continue;
    }
    const html = await readFile(filename, "utf8");
    const document = parse5.parse(html);
    const htmlNode = document.childNodes.find((node) => node.tagName === "html");
    const head = htmlNode?.childNodes.find((node) => node.tagName === "head");
    const body = htmlNode?.childNodes.find((node) => node.tagName === "body");
    const headNodes = head ? findAll(head, () => true) : [];
    const bodyNodes = body ? findAll(body, () => true) : [];
    const titleNode = headNodes.find((node) => node.tagName === "title");
    const descriptionNode = headNodes.find((node) => node.tagName === "meta" && attribute(node, "name") === "description");
    const canonicalNode = headNodes.find((node) => node.tagName === "link" && attribute(node, "rel") === "canonical");
    const title = nodeText(titleNode).trim();
    const description = attribute(descriptionNode, "content")?.trim();
    if (!document.childNodes.some((node) => node.nodeName === "#documentType")) failures.push(`${route}: missing doctype.`);
    if (!head || !body) failures.push(`${route}: invalid HTML structure.`);
    if (attribute(htmlNode, "lang") !== lang) failures.push(`${route}: incorrect html lang.`);
    if (!title) failures.push(`${route}: missing title.`);
    else if (titles.has(title)) failures.push(`${route}: duplicate title "${title}".`);
    else titles.add(title);
    if (!description) failures.push(`${route}: missing meta description.`);
    if (attribute(canonicalNode, "href") !== `${SITE}${route}`) failures.push(`${route}: missing self-canonical in head.`);
    for (const targetLang of LANGS) {
      const alternate = headNodes.find((node) => node.tagName === "link" && attribute(node, "hreflang") === targetLang);
      if (attribute(alternate, "href") !== `${SITE}${routePath(targetLang, page)}`) failures.push(`${route}: missing ${targetLang} hreflang in head.`);
    }
    const defaultAlternate = headNodes.find((node) => node.tagName === "link" && attribute(node, "hreflang") === "x-default");
    if (attribute(defaultAlternate, "href") !== `${SITE}${routePath("es", page)}`) {
      failures.push(`${route}: missing x-default hreflang in head.`);
    }
    if (!headNodes.some((node) => node.tagName === "script" && attribute(node, "type") === "application/ld+json")) failures.push(`${route}: missing structured data in head.`);
    if (bodyNodes.some((node) => node.tagName === "title" || (node.tagName === "meta" && ["description", "robots"].includes(attribute(node, "name"))) || (node.tagName === "link" && attribute(node, "rel") === "canonical"))) {
      failures.push(`${route}: SEO metadata found in body.`);
    }
    const headings = bodyNodes.filter((node) => node.tagName === "h1");
    if (headings.length !== 1) failures.push(`${route}: expected one h1, found ${headings.length}.`);
    const expectedSectionLabel = SECTION_LABELS[lang][page];
    if ((attribute(body, "data-section-label") || "") !== (expectedSectionLabel || "")) {
      failures.push(`${route}: incorrect localized topbar section label.`);
    }
    if (page === "home" && (bodyNodes.some((node) => attribute(node, "id") === "atom") || html.includes("/atom/atom.js"))) {
      failures.push(`${route}: OpsLaundry home must not mount unrelated animated content.`);
    }
    if (page === "privacy" && !bodyNodes.some((node) => node.tagName === "article" && (attribute(node, "class") || "").split(/\s+/u).includes("legal-copy"))) {
      failures.push(`${route}: missing privacy article.`);
    }
    const pageNavScripts = bodyNodes.filter((node) => node.tagName === "script" && attribute(node, "src") === "/shared/ui/section-navigation.js");
    if (pageNavScripts.length !== 1) failures.push(`${route}: expected one page navigation script, found ${pageNavScripts.length}.`);
    const pageScripts = bodyNodes.filter((node) => node.tagName === "script" && attribute(node, "src") === "/shared/ui/page.js");
    if (pageScripts.length !== 1) failures.push(`${route}: expected one direct-navigation script, found ${pageScripts.length}.`);
    const topbarScripts = bodyNodes.filter((node) => node.tagName === "script" &&
      ["header.js", "footer.js"].some((name) => attribute(node, "src") === `/shared/ui/${name}`));
    if (topbarScripts.length) failures.push(`${route}: topbar must be rendered in HTML, not built at runtime.`);
    if (!bodyNodes.some((node) => hasClass(node, "topbar-logo--wordmark"))) failures.push(`${route}: missing static wordmark class.`);
    if (!bodyNodes.some((node) => hasClass(node, "footer-brand")) ||
        !bodyNodes.some((node) => node.tagName === "a" && attribute(node, "href") === routePath(lang, "about"))) {
      failures.push(`${route}: missing static footer links.`);
    }
    if (Buffer.byteLength(html.slice(0, html.indexOf('<meta charset="UTF-8">') + 22)) > 1024) {
      failures.push(`${route}: UTF-8 declaration must be within the first 1024 bytes.`);
    }
    if (page === "contact") {
      const heading = headings[0];
      const form = bodyNodes.find((node) => node.tagName === "form" && hasClass(node, "contact-form"));
      const formNodes = form ? findAll(form, () => true) : [];
      const card = bodyNodes.find((node) => node.tagName === "section" && hasClass(node, "contact-form-card") && hasClass(node, "contact-form-container"));
      const consent = formNodes.find((node) => node.tagName === "label" && hasClass(node, "form-consent-label"));
      const consentElements = (consent?.childNodes || []).filter((node) => node.tagName);
      const textarea = formNodes.find((node) => node.tagName === "textarea" && attribute(node, "name") === "mensaje");
      const subject = formNodes.find((node) => node.tagName === "input" && attribute(node, "name") === "asunto");
      const contactScripts = bodyNodes.filter((node) => node.tagName === "script" && attribute(node, "src") === "/features/contact/init.js");
      if (!hasClass(heading, "contact-page-title--visually-hidden")) failures.push(`${route}: contact h1 must remain visually hidden.`);
      if (!card || !form || !formNodes.some((node) => hasClass(node, "form-grid"))) failures.push(`${route}: incomplete contact form structure.`);
      if (attribute(textarea, "rows") !== "6" || !hasClass(textarea, "field")) failures.push(`${route}: incorrect contact message field.`);
      if (attribute(subject, "type") !== "hidden" || attribute(subject, "value") !== "opslaundry") failures.push(`${route}: contact subject must identify OpsLaundry.`);
      if (consentElements.length !== 2 || consentElements[0]?.tagName !== "input" || consentElements[1]?.tagName !== "span") failures.push(`${route}: privacy consent text must stay grouped beside its checkbox.`);
      for (const label of formNodes.filter((node) => node.tagName === "label")) {
        const controlId = attribute(label, "for");
        if (!controlId || !formNodes.some((node) => attribute(node, "id") === controlId)) failures.push(`${route}: contact label is not paired with a field.`);
      }
      if (contactScripts.length !== 1) failures.push(`${route}: expected one contact form controller, found ${contactScripts.length}.`);
    }
    if (bodyNodes.some((node) => node.tagName === "script" && (attribute(node, "src") || "").includes("/nfc/"))) {
      failures.push(`${route}: page navigation must not depend on NFC code.`);
    }
    const runtimeConfigScripts = headNodes.filter((node) =>
      node.tagName === "script" && attribute(node, "src") === "/static/js/config/runtime-config.js");
    const needsFirebase = page === "machinery" || page === "spares" || page === "submission";
    if (runtimeConfigScripts.length !== (needsFirebase ? 1 : 0)) {
      failures.push(`${route}: Firebase runtime config must load only on data-backed public pages.`);
    }
    if (bodyNodes.some((node) => node.tagName === "script" &&
      (attribute(node, "src") || "").includes("/features/machinery/editor.js"))) {
      failures.push(`${route}: machinery admin editor must be loaded dynamically, not by public HTML.`);
    }
    const powered = bodyNodes.find((node) => node.tagName === "div" &&
      (attribute(node, "class") || "").split(/\s+/u).includes("footer-studio-credit"));
    const poweredLink = powered ? findAll(powered, (node) => node.tagName === "a")[0] : null;
    if (attribute(powered, "lang") !== "en" ||
        attribute(poweredLink, "aria-label") !== "Unátomo Studio" ||
        !nodeText(powered).includes("Built with AI, shaped by real industry experience.") ||
        !nodeText(powered).includes("AI created this site’s content and continues to develop its content, structure and communication under human direction.") ||
        attribute(poweredLink, "href") !== "https://unatomo.com/studio/" ||
        attribute(poweredLink, "target") !== "_blank" ||
        attribute(poweredLink, "rel") !== "noopener") {
      failures.push(`${route}: footer must include the English AI credit and link to Unátomo Studio.`);
    }
    const expectedBackHref = page === "home" ? "/" : routePath(lang, page === "submission" ? "machinery" : "home");
    if (attribute(body, "data-back-href") !== expectedBackHref) failures.push(`${route}: incorrect back destination.`);
    if (/â|Ã|Â|ï»¿|�/u.test(html)) failures.push(`${route}: possible mojibake detected.`);
    if (/(?:data-(?:i18n|home-i18n|detail-i18n|spares-i18n)|\/i18n\/|app:language-change|unatomoI18n)/u.test(html)) {
      failures.push(`${route}: contains legacy client-side translation code.`);
    }
  }
}

const pageSource = await readFile("site/shared/ui/page.js", "utf8");
if (!pageSource.includes('["/",')) failures.push("page.js: missing direct route for root.");

if (failures.length) {
  console.error("OpsLaundry locale check failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log("OK: 44 localized OpsLaundry pages, translated routes, shell and SEO alternates verified.");
