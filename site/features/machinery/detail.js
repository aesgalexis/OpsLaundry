import {subscribeMachine} from "/features/machinery/public-repository.js";

const article = document.querySelector("[data-machine-detail]");
const copyElement = document.querySelector("#laundry-machinery-copy");
const copy = copyElement ? JSON.parse(copyElement.textContent) : {labels: {}, typeLabels: {}, stateLabels: {}};
const lang = ["es", "en", "it", "el"].includes(document.documentElement.lang)
  ? document.documentElement.lang
  : "es";
const messages = {
  es: {unavailable: "Esta máquina ya no está disponible.", error: "No se pudo comprobar la disponibilidad actual."},
  en: {unavailable: "This machine is no longer available.", error: "Current availability could not be checked."},
  it: {unavailable: "Questo macchinario non è più disponibile.", error: "Non è stato possibile verificare la disponibilità attuale."},
  el: {unavailable: "Αυτό το μηχάνημα δεν είναι πλέον διαθέσιμο.", error: "Δεν ήταν δυνατός ο έλεγχος της τρέχουσας διαθεσιμότητας."},
};

const normalizeKey = (value) => String(value || "").trim().toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/gu, "").replace(/[^a-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "");
const translate = (dictionary, value) => dictionary[normalizeKey(value)] || value || "";
const capacity = (machine) => machine.capacidad || String(machine.modelo || "")
  .match(/\b\d+(?:[.,]\d+)?\s*(?:kg|kgs|l|lt|lts)\b/iu)?.[0] || "";
const formatPrice = (machine) => {
  if (typeof machine.precioAmount === "number" && Number.isFinite(machine.precioAmount)) {
    return `${Math.round(machine.precioAmount).toString().replace(/\B(?=(\d{3})+(?!\d))/gu, ".")} EUR`;
  }
  return String(machine.precioTexto || "").trim().toLowerCase() === "consultar"
    ? copy.labels.consult
    : machine.precioTexto || "";
};
const warrantyText = (machine) => {
  const labels = copy.labels;
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
const extrasText = (machine) => {
  const labels = copy.labels;
  const extras = [];
  if (machine.envioIncluido && machine.puestaEnMarchaIncluida) extras.push(labels.shippingStartup);
  else if (machine.envioIncluido) extras.push(labels.shippingOnly);
  else if (machine.puestaEnMarchaIncluida) extras.push(labels.startupOnly);
  const warranty = warrantyText(machine);
  if (warranty) extras.push(warranty);
  return extras.length ? ` · ${extras.join(" · ")}` : "";
};
const setField = (key, value) => {
  const field = article?.querySelector(`[data-machine-field="${key}"]`);
  const row = field?.closest("div");
  if (field) field.textContent = value == null ? "" : String(value);
  if (row) row.hidden = !String(value ?? "").trim();
};
const contactHref = (machine, type) => {
  const params = new URLSearchParams({
    subject: "investment", type, brand: machine.marca || "", model: machine.modelo || "",
    year: machine.anio == null ? "" : String(machine.anio), id: machine.id || "",
  });
  return `${copy.contactPath}?${params.toString()}`;
};
const setRobots = (content) => {
  let meta = document.querySelector('meta[name="robots"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "robots";
    document.head.append(meta);
  }
  meta.content = content;
};
const showStatus = (message, unavailable = false) => {
  const status = article?.querySelector("[data-machine-status]");
  if (!status) return;
  status.textContent = message;
  status.hidden = false;
  status.dataset.unavailable = unavailable ? "true" : "false";
};

const renderMachine = (machine) => {
  if (!article) return;
  if (!machine || machine.visible === false) {
    article.dataset.machineAvailable = "false";
    showStatus(messages[lang].unavailable, true);
    article.querySelector("[data-machine-contact]")?.setAttribute("hidden", "");
    setRobots("noindex, follow");
    return;
  }
  article.dataset.machineAvailable = "true";
  const type = translate(copy.typeLabels, machine.categoria);
  const state = translate(copy.stateLabels, machine.estado);
  const title = `${machine.marca || ""} ${machine.modelo || ""}`.trim();
  const heading = article.querySelector("h1");
  const kicker = article.querySelector(".ls-machine-detail-kicker");
  if (heading) heading.textContent = title;
  if (kicker) kicker.textContent = `${type} · ${machine.id}`;
  document.title = `${title} | OpsLaundry`;
  setField("type", type);
  setField("brand", machine.marca);
  setField("model", machine.modelo);
  setField("capacity", capacity(machine));
  setField("year", machine.anio);
  setField("status", state);
  setField("location", machine.ubicacion);
  setField("heating", translate(copy.heatingLabels || {}, machine.calefaccion));
  const price = article.querySelector("[data-machine-price]");
  if (price) price.textContent = formatPrice(machine);
  const extras = article.querySelector("[data-machine-extras]");
  if (extras) extras.textContent = extrasText(machine);
  const comments = article.querySelector("[data-machine-comments]");
  if (comments) {
    comments.textContent = machine.comentarios || "";
    comments.hidden = !machine.comentarios;
  }
  const gallery = article.querySelector("[data-machine-gallery]");
  if (gallery) {
    gallery.replaceChildren();
    (Array.isArray(machine.imagenes) ? machine.imagenes : []).forEach((image, index) => {
      const url = typeof image === "string" ? image : image?.url;
      if (!/^https?:\/\//iu.test(url || "")) return;
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noreferrer";
      const img = document.createElement("img");
      img.src = url;
      img.alt = `${machine.id} ${copy.labels.image} ${index + 1}`;
      img.loading = "lazy";
      link.append(img);
      gallery.append(link);
    });
  }
  const contact = article.querySelector("[data-machine-contact]");
  if (contact) {
    contact.href = contactHref(machine, type);
    contact.hidden = false;
  }
};

if (article?.dataset.machineId) {
  subscribeMachine(article.dataset.machineId, renderMachine, () => showStatus(messages[lang].error));
}
