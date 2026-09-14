import {functions} from "/shared/firebase/functions.js";
import {httpsCallable} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js";
import {prepareImages} from "/shared/forms/image-upload.js";
import {setupMachineFields} from "./fields.js";

const form = document.querySelector("#machine-submission");
setupMachineFields(form);
const copy = JSON.parse(document.querySelector("#submission-copy").textContent);
const status = document.querySelector("#submission-status");
const input = document.querySelector("#images");
const upload = document.querySelector("#submission-upload");
const uploadAction = upload?.querySelector(".submission-upload-action");
const defaultUploadAction = uploadAction?.textContent || "";
const button = form.querySelector('button[type="submit"]');
const send = httpsCallable(functions, "submitLaundryMachine");
let submissionId = crypto.randomUUID();
let attemptedPayload = null;
let urls = [];
const updateImages = () => {
  urls.forEach(URL.revokeObjectURL);
  urls = [];
  document.querySelector("#image-preview").replaceChildren();
  const files = [...input.files];
  if (files.length < 1 || files.length > 4 || files.some((f) =>
    f.size > 8 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(f.type))) {
    input.value = "";
    upload?.classList.remove("has-files");
    if (uploadAction) uploadAction.textContent = defaultUploadAction;
    status.textContent = copy.images;
    return;
  }
  upload?.classList.add("has-files");
  if (uploadAction) uploadAction.textContent = files.map((file) => file.name).join(", ");
  status.textContent = "";
  files.forEach((file) => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    urls.push(img.src);
    document.querySelector("#image-preview").append(img);
  });
};
input.addEventListener("change", updateImages);
upload?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  input.click();
});
upload?.addEventListener("dragover", (event) => {
  event.preventDefault();
  upload.classList.add("is-dragover");
});
upload?.addEventListener("dragleave", (event) => {
  if (event.relatedTarget && upload.contains(event.relatedTarget)) return;
  upload.classList.remove("is-dragover");
});
upload?.addEventListener("drop", (event) => {
  event.preventDefault();
  upload.classList.remove("is-dragover");
  const dropped = [...(event.dataTransfer?.files || [])];
  const transfer = new DataTransfer();
  dropped.forEach((file) => transfer.items.add(file));
  input.files = transfer.files;
  updateImages();
});
let submitting = false;
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (submitting) return;
  if (!form.reportValidity()) return;
  submitting = true;
  button.disabled = true;
  status.textContent = copy.sending;
  try {
    const data = Object.fromEntries(new FormData(form));
    for (const key of ["privacyAccepted", "envioIncluido", "puestaEnMarchaIncluida"]) {
      data[key] = form.elements[key].checked;
    }
    data.language = document.documentElement.lang;
    data.images = await prepareImages(input);
    const serialized = JSON.stringify(data);
    if (attemptedPayload && attemptedPayload !== serialized) submissionId = crypto.randomUUID();
    attemptedPayload = serialized;
    const result = await send({...data, submissionId});
    if (!result.data.accepted) throw new Error("not-accepted");
    status.textContent = copy.success + " " + result.data.requestId;
    form.querySelectorAll("input, select, textarea, button").forEach((el) => { el.disabled = true; });
  } catch {
    status.textContent = copy.error;
    submitting = false;
    button.disabled = false;
  }
});
