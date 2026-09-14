import {ROUTES} from "../../shared/routes.mjs";
// Pure presentation rules shared by the static build and the live views.
export const SITE = "https://opslaundry.com";
export const LOCALES = {
  es: {route: ROUTES.es.machinery, locale: "es_ES", back: "Volver al listado", contact: "Contactar", description: "Maquinaria de ocasión disponible en OpsLaundry."},
  en: {route: ROUTES.en.machinery, locale: "en_GB", back: "Back to the list", contact: "Contact", description: "Used machinery available from OpsLaundry."},
  it: {route: ROUTES.it.machinery, locale: "it_IT", back: "Torna all'elenco", contact: "Contatta", description: "Macchinario usato disponibile presso OpsLaundry."},
  el: {route: ROUTES.el.machinery, locale: "el_GR", back: "Επιστροφή στη λίστα", contact: "Επικοινωνία", description: "Μεταχειρισμένο μηχάνημα διαθέσιμο από την OpsLaundry."},
};
export const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
export const normalizeKey = (value) => String(value || "").trim().toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/gu, "").replace(/[^a-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "");
export const translate = (dictionary, value) => dictionary?.[normalizeKey(value)] || value || "";
export const publicImageUrl = (image) => {
  const url = typeof image === "string" ? image : image?.url || "";
  return /^https?:\/\//iu.test(url) ? url : "";
};
export const capacity = (machine) => machine.capacidad || String(machine.modelo || "")
  .match(/\b\d+(?:[.,]\d+)?\s*(?:kg|kgs|l|lt|lts)\b/iu)?.[0] || "";
export const formatPrice = (machine, labels) => {
  if (typeof machine.precioAmount === "number" && Number.isFinite(machine.precioAmount)) {
    return `${Math.round(machine.precioAmount).toString().replace(/\B(?=(\d{3})+(?!\d))/gu, ".")} EUR`;
  }
  return String(machine.precioTexto || "").trim().toLowerCase() === "consultar"
    ? labels.consult : machine.precioTexto || "";
};
export const warrantyText = (machine, labels) => {
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
export const buildExtras = (machine, labels) => {
  const extras = [];
  if (machine.envioIncluido && machine.puestaEnMarchaIncluida) extras.push(labels.shippingStartup);
  else if (machine.envioIncluido) extras.push(labels.shippingOnly);
  else if (machine.puestaEnMarchaIncluida) extras.push(labels.startupOnly);
  const warranty = warrantyText(machine, labels);
  if (warranty) extras.push(warranty);
  return extras;
};
export const extrasText = (machine, labels) => {
  const extras = buildExtras(machine, labels);
  return extras.length ? ` · ${extras.join(" · ")}` : "";
};
export const machineRoute = (lang, id) => `/${lang}/${LOCALES[lang].route}/${encodeURIComponent(id)}/`;
export const contactHref = (machine, copy, type) => {
  const params = new URLSearchParams({subject: "investment", type, brand: machine.marca || "",
    model: machine.modelo || "", year: machine.anio == null ? "" : String(machine.anio), id: machine.id || ""});
  return `${copy.contactPath}?${params.toString()}`;
};
