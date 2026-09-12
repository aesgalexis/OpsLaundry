import {functions} from "/static/js/firebase/firebaseApp.js";
import {setupMachineFields} from "./fields.js";
import {httpsCallable} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js";
import {observeMachineAdmin, isAdminUser, loginWithGoogle} from "/ls_maquinaria/agregador/firebase-config.js";

const list = httpsCallable(functions, "listLaundryMachineSubmissions");
const review = httpsCallable(functions, "reviewLaundryMachineSubmission");
const getImage = httpsCallable(functions, "getLaundryMachineSubmissionImage");
const panel = document.querySelector("#review-panel");
const items = document.querySelector("#requests");
const status = document.querySelector("#review-status");
const filter = document.querySelector("#status-filter");
const more = document.querySelector("#more");
const login = document.querySelector("#login");
let cursor = null;
let allowed = false;
let generation = 0;
let imageUrls = [];
function clearItems() {
  imageUrls.forEach(URL.revokeObjectURL);
  imageUrls = [];
  items.replaceChildren();
}
const labels = {pending: "Pendiente", approving: "Publicación en curso", approved: "Aprobada", rejected: "Rechazada"};
function render(item) {
  const card = document.createElement("details");
  card.className = "card submission-item";
  const heading = document.createElement("summary");
  heading.textContent = `${item.draft.marca} ${item.draft.modelo} · ${labels[item.status]} · ${item.id.slice(0, 8)}`;
  const contact = document.createElement("p");
  contact.className = "submission-contact";
  contact.textContent = `${item.contact.name}\n${item.contact.company}\n${item.contact.email}\n${item.contact.phone}\n${item.createdAt || ""}`;
  const photos = document.createElement("div");
  photos.className = "submission-images";
  let imagesLoaded = false;
  card.addEventListener("toggle", async () => {
    if (!card.open || imagesLoaded || !allowed) return;
    imagesLoaded = true;
    photos.textContent = "Cargando fotos…";
    try {
      const loaded = await Promise.all(item.images.map(async (image) => {
        const result = await getImage({id: item.id, index: image.index});
        return {...image, ...result.data};
      }));
      if (!allowed || !card.isConnected) return;
      photos.replaceChildren();
      loaded.forEach((image) => {
    const bytes = Uint8Array.from(atob(image.content), (ch) => ch.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], {type: image.type}));
    imageUrls.push(url);
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
    const img = document.createElement("img");
    img.src = url;
    img.alt = image.name;
    link.append(img);
    photos.append(link);
      });
    } catch {
      photos.textContent = "No se pudieron cargar las fotos. Cierra y abre la solicitud para reintentar.";
      imagesLoaded = false;
    }
  });
  const form = document.createElement("form");
  form.append(document.querySelector("#review-fields").content.cloneNode(true));
  form.querySelectorAll("[name]").forEach((el) => {
    if (el.type === "checkbox") el.checked = item.draft[el.name] === true;
    else el.value = item.draft[el.name] || "";
    if (el.id) {
      form.querySelector(`label[for="${el.id}"]`)?.setAttribute("for", item.id + "-" + el.id);
      el.id = item.id + "-" + el.id;
    }
    el.disabled = item.status !== "pending";
  });
  setupMachineFields(form);
  const message = document.createElement("p");
  message.setAttribute("role", "status");
  const actions = document.createElement("div");
  actions.className = "submission-actions";
  async function act(action) {
    if (action === "approve" && !form.reportValidity()) return;
    if (!window.confirm(action === "approve" ?
      "¿Aprobar y publicar esta máquina con los datos mostrados?" : "¿Rechazar esta solicitud?")) return;
    actions.querySelectorAll("button").forEach((b) => { b.disabled = true; });
    message.textContent = "Guardando…";
    const draft = Object.fromEntries(new FormData(form));
    ["envioIncluido", "puestaEnMarchaIncluida"].forEach((key) => { draft[key] = form.elements[key].checked; });
    try {
      const result = await review({id: item.id, action, draft});
      message.textContent = result.data.status === "approved" ? "Publicada: " + result.data.machineId : "Solicitud rechazada.";
      heading.textContent = `${item.draft.marca} ${item.draft.modelo} · ${labels[result.data.status]}`;
      form.querySelectorAll("input, select, textarea").forEach((el) => { el.disabled = true; });
      actions.hidden = true;
    } catch {
      message.textContent = "No se pudo completar. Actualiza la lista para comprobar el estado; si figura en curso, puedes reintentar la publicación.";
      actions.querySelectorAll("button").forEach((b) => { b.disabled = false; });
    }
  }
  if (["pending", "approving"].includes(item.status)) {
    for (const action of item.status === "pending" ? ["approve", "reject"] : ["approve"]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn-pill";
      button.textContent = action === "reject" ? "Rechazar" :
        item.status === "approving" ? "Reintentar publicación" : "Aprobar y publicar";
      button.addEventListener("click", () => act(action));
      actions.append(button);
    }
  }
  form.addEventListener("submit", (event) => event.preventDefault());
  form.append(actions, message);
  card.append(heading, contact, photos, form);
  if (item.machineId && item.status === "approved") {
    const link = document.createElement("a");
    link.textContent = "Ver máquina " + item.machineId;
    link.href = "/es/maquinaria-ocasion/?machine=" + encodeURIComponent(item.machineId);
    card.append(link);
  }
  items.append(card);
  return card;
}
async function load(append = false, id = "") {
  if (!allowed) return;
  const current = ++generation;
  if (!append) { clearItems(); cursor = null; }
  more.hidden = true;
  status.textContent = "Cargando…";
  try {
    const result = await list({status: filter.value, cursor: append ? cursor : null, id});
    if (current !== generation || !allowed) return;
    result.data.items.forEach((item) => { const card = render(item); if (id) card.open = true; });
    cursor = result.data.cursor;
    more.hidden = !cursor;
    status.textContent = items.childElementCount ? "" : "No hay solicitudes.";
  } catch {
    if (current !== generation || !allowed) return;
    status.textContent = "No se pudieron cargar las solicitudes. Comprueba tu conexión y que las funciones estén desplegadas.";
  }
}
observeMachineAdmin((user) => {
  allowed = isAdminUser(user);
  ++generation;
  panel.hidden = !allowed;
  login.hidden = !!user;
  document.querySelector("#access-status").textContent = allowed ? "" :
    user ? "Esta cuenta no tiene permiso de administración de Laundry Services." : "Inicia sesión para revisar las solicitudes.";
  if (allowed) load(false, new URLSearchParams(location.search).get("request") || "");
  else clearItems();
});
login.addEventListener("click", async () => {
  try { await loginWithGoogle(); } catch { document.querySelector("#access-status").textContent = "No se pudo iniciar sesión."; }
});
filter.addEventListener("change", () => load());
document.querySelector("#refresh").addEventListener("click", () => load());
more.addEventListener("click", () => load(true));
