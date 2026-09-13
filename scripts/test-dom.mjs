// Minimal DOM adapter for Node-only structural tests; no browser or layout engine.
import parse5 from "parse5";

export function createDocument(html) {
  const tree = parse5.parse(html);
  const wrappers = new WeakMap();
  function wrap(node) {
    if (!node) return null;
    if (wrappers.has(node)) return wrappers.get(node);
    const element = {
      node,
      get parentNode() { return wrap(node.parentNode); },
      get children() { return (node.childNodes || []).filter((child) => child.tagName).map(wrap); },
      getAttribute(name) { return node.attrs?.find((item) => item.name === name)?.value ?? null; },
      setAttribute(name, value) {
        node.attrs = (node.attrs || []).filter((item) => item.name !== name);
        node.attrs.push({name, value: String(value)});
      },
      removeAttribute(name) { node.attrs = (node.attrs || []).filter((item) => item.name !== name); },
      get textContent() {
        return node.nodeName === "#text" ? node.value : (node.childNodes || []).map((child) => wrap(child).textContent).join("");
      },
      set textContent(value) { this.replaceChildren(String(value)); },
      get hidden() { return this.getAttribute("hidden") !== null; },
      set hidden(value) { if (value) this.setAttribute("hidden", ""); else this.removeAttribute("hidden"); },
      remove() {
        if (node.parentNode) node.parentNode.childNodes = node.parentNode.childNodes.filter((child) => child !== node);
        node.parentNode = null;
      },
      append(...items) {
        for (const item of items) {
          const child = typeof item === "string" ? {nodeName: "#text", value: item} : item.node;
          wrap(child).remove();
          child.parentNode = node;
          (node.childNodes ||= []).push(child);
        }
      },
      prepend(...items) {
        const previous = [...(node.childNodes || [])];
        this.replaceChildren(...items, ...previous.map(wrap));
      },
      replaceChildren(...items) { node.childNodes = []; this.append(...items); },
      insertBefore(item, reference) {
        item.remove();
        item.node.parentNode = node;
        const index = reference ? node.childNodes.indexOf(reference.node) : node.childNodes.length;
        node.childNodes.splice(index, 0, item.node);
      },
      querySelectorAll(selector) {
        const parts = selector.split(/\s+(?![^\[]*\])/u);
        const matches = (candidate, part) => {
          if (!candidate.tagName) return false;
          const el = wrap(candidate);
          const tag = part.match(/^[a-z][\w-]*/iu)?.[0];
          if (tag && candidate.tagName !== tag) return false;
          for (const [, kind, value] of part.matchAll(/([.#])([\w-]+)/gu)) {
            if (kind === "#" ? el.getAttribute("id") !== value : !el.classList.contains(value)) return false;
          }
          for (const [, name, value] of part.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/gu)) {
            if (value === undefined ? el.getAttribute(name) === null : el.getAttribute(name) !== value) return false;
          }
          return true;
        };
        const results = [];
        function visit(candidate) {
          if (matches(candidate, parts.at(-1))) {
            let ancestor = candidate.parentNode;
            let index = parts.length - 2;
            while (index >= 0 && ancestor) {
              if (matches(ancestor, parts[index])) index--;
              ancestor = ancestor.parentNode;
            }
            if (index < 0) results.push(wrap(candidate));
          }
          for (const child of candidate.childNodes || []) visit(child);
        }
        for (const child of node.childNodes || []) visit(child);
        return results;
      },
      querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
    };
    element.classList = {
      contains: (name) => (element.getAttribute("class") || "").split(/\s+/u).includes(name),
      add: (...names) => element.setAttribute("class", [...new Set((element.getAttribute("class") || "").split(/\s+/u).filter(Boolean).concat(names))].join(" ")),
      remove: (...names) => element.setAttribute("class", (element.getAttribute("class") || "").split(/\s+/u).filter((name) => !names.includes(name)).join(" ")),
    };
    for (const [property, attribute] of Object.entries({className: "class", src: "src", alt: "alt", href: "href", width: "width",
      height: "height", loading: "loading", decoding: "decoding", lang: "lang", content: "content", type: "type", name: "name"})) {
      Object.defineProperty(element, property, {get: () => element.getAttribute(attribute) || "", set: (value) => element.setAttribute(attribute, value)});
    }
    wrappers.set(node, element);
    return element;
  }
  const document = wrap(tree);
  document.documentElement = document.querySelector("html");
  document.head = document.querySelector("head");
  document.getElementById = (id) => document.querySelector(`#${id}`);
  document.createElement = (tag) => wrap({nodeName: tag, tagName: tag, attrs: [], childNodes: [], namespaceURI: "http://www.w3.org/1999/xhtml"});
  document.createElementNS = (namespace, tag) => { const el = document.createElement(tag); el.node.namespaceURI = namespace; return el; };
  Object.defineProperty(document, "title", {
    get: () => document.querySelector("title")?.textContent || "",
    set: (value) => { document.querySelector("title").textContent = value; },
  });
  return document;
}

export function semanticTree(node) {
  if (node.nodeName === "#text") return node.value.trim() ? node.value : null;
  if (!node.tagName) return null;
  return {tag: node.tagName, attrs: Object.fromEntries((node.attrs || []).map(({name, value}) => [name, value]).sort()),
    children: (node.childNodes || []).map(semanticTree).filter((child) => child !== null)};
}
