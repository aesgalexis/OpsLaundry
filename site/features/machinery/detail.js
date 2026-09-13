import {subscribeMachine} from "/features/machinery/public-repository.js";
import {translate, capacity, formatPrice, extrasText, contactHref} from "./presentation.mjs";
import {updateMachineMetadata} from "./seo.mjs";

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

const setField = (key, value) => {
  const field = article?.querySelector(`[data-machine-field="${key}"]`);
  const row = field?.closest("div");
  if (field) field.textContent = value == null ? "" : String(value);
  if (row) row.hidden = !String(value ?? "").trim();
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
  updateMachineMetadata(document, machine, lang, copy);
  if (!machine || machine.visible === false) {
    article.dataset.machineAvailable = "false";
    showStatus(messages[lang].unavailable, true);
    article.querySelector("[data-machine-contact]")?.setAttribute("hidden", "");
    return;
  }
  article.dataset.machineAvailable = "true";
  const status = article.querySelector("[data-machine-status]");
  if (status) status.hidden = true;
  const type = translate(copy.typeLabels, machine.categoria);
  const state = translate(copy.stateLabels, machine.estado);
  const title = `${machine.marca || ""} ${machine.modelo || ""}`.trim();
  const heading = article.querySelector("h1");
  const kicker = article.querySelector(".machine-detail-kicker");
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
  if (price) price.textContent = formatPrice(machine, copy.labels);
  const extras = article.querySelector("[data-machine-extras]");
  if (extras) extras.textContent = extrasText(machine, copy.labels);
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
    contact.href = contactHref(machine, copy, type);
    contact.hidden = false;
  }
};

if (article?.dataset.machineId) {
  subscribeMachine(article.dataset.machineId, renderMachine, () => showStatus(messages[lang].error));
}
