import {routePath} from "../site/shared/routes.mjs";
import {readFile, readdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {parse, attr, all, byClass, byId, setAttr, remove, fragment, prepend, outerHtml, applyReplacements} from "./html-tree.mjs";
import {footerNavigation} from "./shell-navigation.mjs";
import {escapeHtml} from "../site/features/machinery/presentation.mjs";

const ABOUT = {
  es: ["Nosotros", "Conocer OpsLaundry", routePath("es", "about")],
  en: ["About us", "About OpsLaundry", routePath("en", "about")],
  it: ["Chi siamo", "Scopri OpsLaundry", routePath("it", "about")],
  el: ["Ποιοι είμαστε", "Γνώρισε την OpsLaundry", routePath("el", "about")],
};

export function renderShell(html, pathname) {
  const tree = parse(html);
  const lang = attr(all(tree, (node) => node.tagName === "html")[0], "lang")?.slice(0, 2) || "es";
  const navigation = footerNavigation[lang] || footerNavigation.es;
  const replacements = [];
  const replace = (node, text) => {
    if (!node?.sourceCodeLocation) return;
    replacements.push({start: node.sourceCodeLocation.startOffset, end: node.sourceCodeLocation.endOffset, text});
  };
  const header = byClass(byId(tree, "topbar-mount") || tree, "topbar");
  if (header) {
    const logo = byClass(header, "topbar-logo");
    if (logo) {
      setAttr(logo, "src", "/assets/brand/wordmark.svg");
      setAttr(logo, "alt", "OpsLaundry");
      setAttr(logo, "class", [...new Set((attr(logo, "class") || "").split(/\s+/u).concat("topbar-logo--wordmark"))].join(" "));
    }
    const name = byClass(header, "topbar-name");
    if (name) { name.childNodes = []; setAttr(name, "hidden", ""); }
    setAttr(header, "class", (attr(header, "class") || "").split(/\s+/u).filter((name) => name !== "is-hidden").join(" "));
    for (const link of all(header, (node) => node.tagName === "a" && attr(node, "href") === "/")) {
      setAttr(link, "href", navigation.home);
    }
    replace(header, outerHtml(header));
  }
  const footer = byId(tree, "legal-footer");
  const control = footer && byClass(footer, "footer-disclosure-control");
  const panel = control && byClass(control, "footer-disclosure-panel");
  if (panel) {
    const label = attr(panel, "aria-label");
    setAttr(footer, "role", "contentinfo");
    if (label) setAttr(footer, "aria-label", label);
    for (const node of all(panel, (node) => ["footer-brand", "footer-about-title", "upperfooter"].some((name) =>
      (attr(node, "class") || "").split(/\s+/u).includes(name)))) remove(node);
    const brand = fragment('<a class="footer-brand" href="' + navigation.home + '"><img src="/assets/brand/wordmark.svg" alt="OpsLaundry" width="760" height="180" loading="lazy" decoding="async"></a>')[0];
    prepend(byClass(panel, "footer-disclosure-identity") || panel, brand);
    const [aboutTitle, aboutLabel, aboutHref] = ABOUT[lang] || ABOUT.es;
    const about = fragment(`<p class="footer-about-title footer-disclosure-contact-title"><span>${aboutTitle}</span><a class="footer-disclosure-contact-form-link" aria-label="${aboutLabel}" href="${aboutHref}"${pathname === aboutHref ? ' aria-current="page"' : ""}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0"></path></svg></a></p>`)[0];
    const contact = byClass(panel, "footer-disclosure-meta");
    if (contact) prepend(contact, about);
    const services = fragment(`<section class="upperfooter" aria-label="OpsLaundry"><div class="upperfooter-col upperfooter-col-main"><p class="upperfooter-kicker">${navigation.title}</p><ul class="upperfooter-list">${navigation.items.map(([text, href]) => `<li><a href="${href}">${escapeHtml(text)}</a></li>`).join("")}</ul></div></section>`)[0];
    services.parentNode = panel;
    panel.childNodes.splice(contact ? panel.childNodes.indexOf(contact) : panel.childNodes.length, 0, services);
    remove(byClass(control, "footer-disclosure-toggle"));
    for (const name of ["hidden", "role", "aria-label"]) setAttr(panel, name, null);
    setAttr(control, "class", (attr(control, "class") || "").split(/\s+/u).filter((name) => !["is-open", "is-closing"].includes(name)).join(" "));
    replace(footer, outerHtml(footer));
    replace(byId(tree, "upperfooter-mount"), "");
  }
  for (const script of all(tree, (node) => node.tagName === "script" &&
    ["header.js", "footer.js"].some((name) => attr(node, "src") === `/shared/ui/${name}`))) replace(script, "");
  return applyReplacements(html, replacements).replace(/^[\t ]+(?=\r?$)/gmu, "");
}

export async function renderSiteShell(directory, prefix = "") {
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await renderSiteShell(filename, `${prefix}/${entry.name}`);
    else if (entry.name.endsWith(".html")) {
      const html = await readFile(filename, "utf8");
      const rendered = renderShell(html, entry.name === "index.html" ? `${prefix}/` : `${prefix}/${entry.name}`);
      if (html !== rendered) await writeFile(filename, rendered, "utf8");
    }
  }
}
