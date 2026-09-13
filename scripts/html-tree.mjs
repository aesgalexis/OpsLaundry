import parse5 from "parse5";

export const parse = (html) => parse5.parse(html, {sourceCodeLocationInfo: true});
export const attr = (node, name) => node?.attrs?.find((item) => item.name === name)?.value;
export const hasClass = (node, name) => (attr(node, "class") || "").split(/\s+/u).includes(name);
export const all = (node, predicate) => {
  const results = predicate(node) ? [node] : [];
  for (const child of node.childNodes || []) results.push(...all(child, predicate));
  return results;
};
export const first = (node, predicate) => all(node, predicate)[0];
export const byClass = (node, name) => first(node, (item) => hasClass(item, name));
export const byId = (node, name) => first(node, (item) => attr(item, "id") === name);
export function setAttr(node, name, value) {
  if (!node) return;
  node.attrs ||= [];
  const existing = node.attrs.find((item) => item.name === name);
  if (value === null) node.attrs = node.attrs.filter((item) => item.name !== name);
  else if (existing) existing.value = String(value);
  else node.attrs.push({name, value: String(value)});
}
export function remove(node) {
  if (node?.parentNode) node.parentNode.childNodes = node.parentNode.childNodes.filter((child) => child !== node);
}
export function fragment(html) {
  return parse5.parseFragment(html).childNodes;
}
export function append(parent, ...children) {
  for (const child of children) { remove(child); child.parentNode = parent; parent.childNodes.push(child); }
}
export function prepend(parent, ...children) {
  for (const child of [...children].reverse()) { remove(child); child.parentNode = parent; parent.childNodes.unshift(child); }
}
export const outerHtml = (node) => parse5.serialize({nodeName: "#document-fragment", childNodes: [node]});
export function applyReplacements(html, replacements) {
  for (const {start, end, text} of replacements.sort((a, b) => b.start - a.start)) {
    html = html.slice(0, start) + text + html.slice(end);
  }
  return html;
}
