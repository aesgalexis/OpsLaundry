/* eslint-disable max-len */
import {createHash} from "node:crypto";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {admin, db} from "../core/firebase";
import {resendApiKey} from "../email/resend";
import {sendLaundryEmail} from "../email/delivery";
import {renderLaundryEmailBrandHeader, REQUEST_DESTINATION, VERIFIED_SENDER} from "../email/branding";
import {escapeHtml} from "../spare-parts/validation";
import {enforceSpareRequestRateLimit} from "../spare-parts/rate-limit";
import {normalizeMachineSubmission} from "./submission-policy";

export const submissions = db.collection("laundry_machine_submissions");
const options = {
  enforceAppCheck: process.env.ENFORCE_APP_CHECK === "true",
  memory: "512MiB" as const, timeoutSeconds: 120, maxInstances: 5,
};

export const submitLaundryMachine = onCall(options, async (request) => {
  const raw = request.data || {};
  if (raw.website) return {accepted: false};
  await enforceSpareRequestRateLimit(request.rawRequest.ip || "unknown");
  const input = normalizeMachineSubmission(raw);
  const fingerprint = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  const ref = submissions.doc(input.id);
  const existing = await ref.get();
  if (existing.exists) {
    if (existing.data()?.fingerprint !== fingerprint) {
      throw new HttpsError("already-exists", "submission-id-used");
    }
    return {accepted: true, requestId: input.id};
  }
  // Content-addressed private objects make concurrent retries safe.
  const bucket = admin.storage().bucket();
  const images = await Promise.all(input.images.map(async (image, index) => {
    const path = `laundry-submissions/${input.id}/${fingerprint}/${index}`;
    await bucket.file(path).save(Buffer.from(image.content, "base64"), {
      resumable: false, metadata: {contentType: image.type},
    });
    return {name: image.name, path, type: image.type};
  }));
  await db.runTransaction(async (tx) => {
    const current = await tx.get(ref);
    if (current.exists) {
      if (current.data()?.fingerprint !== fingerprint) {
        throw new HttpsError("already-exists", "submission-id-used");
      }
      return;
    }
    tx.create(ref, {
      contact: input.contact, draft: input.draft, images,
      language: input.language, privacyAccepted: true, fingerprint,
      status: "pending", createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  return {accepted: true, requestId: input.id};
});

// Retry independently of the browser: a mail failure cannot lose a proposal.
export const notifyLaundryMachineSubmission = onDocumentCreated({
  document: "laundry_machine_submissions/{submissionId}",
  secrets: [resendApiKey], retry: true,
}, async (event) => {
  const data = event.data?.data();
  if (!data) return;
  const id = event.params.submissionId;
  const link = `https://opslaundry.com/requests/?request=${encodeURIComponent(id)}`;
  const summary = Object.entries(data.draft).map(([k, v]) => `${k}: ${v}`).join("\n");
  const text = `Nueva propuesta ${id}\n${data.contact.name}\n${data.contact.email}\n${data.contact.phone}\n${data.contact.company}\n\n${summary}\n\nRevisar: ${link}`;
  const common = {from: VERIFIED_SENDER, tags: [{name: "category", value: "machine-submission"}]};
  await sendLaundryEmail({
    ...common, to: [REQUEST_DESTINATION], reply_to: data.contact.email,
    subject: `Máquina pendiente: ${data.draft.marca} ${data.draft.modelo}`,
    text, html: `${renderLaundryEmailBrandHeader()}<pre>${escapeHtml(text)}</pre><p><a href="${link}">Revisar solicitud</a></p>`,
  }, `machine-internal-${id}`, "Machine submission");
  const confirmations: Record<string, string> = {
    es: "Hemos recibido tu máquina. Está pendiente de valoración; todavía no está publicada.",
    en: "We have received your machine. It is awaiting review and is not yet published.",
    it: "Abbiamo ricevuto la tua macchina. È in attesa di valutazione e non è ancora pubblicata.",
    el: "Λάβαμε το μηχάνημά σας. Αναμένει αξιολόγηση και δεν έχει δημοσιευτεί ακόμη.",
  };
  const message = `${confirmations[data.language] || confirmations.es}\n${id}`;
  await sendLaundryEmail({
    ...common, to: [data.contact.email], reply_to: REQUEST_DESTINATION,
    subject: "OpsLaundry · " + id.slice(0, 8),
    text: message, html: `${renderLaundryEmailBrandHeader()}<p>${escapeHtml(message)}</p>`,
  }, `machine-confirm-${id}`, "Machine submission confirmation");
  await event.data?.ref.update({notificationSentAt: admin.firestore.FieldValue.serverTimestamp()});
});

export const listLaundryMachineSubmissions = onCall(options, async (request) => {
  if (request.auth?.token.laundryServicesAdmin !== true) {
    throw new HttpsError("permission-denied", "admin-only");
  }
  const status = ["pending", "approving", "approved", "rejected"].includes(request.data?.status) ?
    request.data.status : "pending";
  const id = request.data?.id;
  if (id && !/^[a-zA-Z0-9-]{16,80}$/.test(id)) {
    throw new HttpsError("invalid-argument", "invalid-id");
  }
  let query = submissions.where("status", "==", status).orderBy("__name__").limit(21);
  if (request.data?.cursor && /^[a-zA-Z0-9-]{16,80}$/.test(request.data.cursor)) {
    query = query.startAfter(request.data.cursor);
  }
  const docs = id ? [await submissions.doc(id).get()] : (await query.get()).docs;
  const more = docs.length > 20;
  const items = await Promise.all(docs.slice(0, 20).filter((d) => d.exists).map(async (doc) => {
    const data = doc.data() || {};
    const images = data.images.map((image: {name: string}, index: number) => ({
      name: image.name, index,
    }));
    return {id: doc.id, contact: data.contact, draft: data.draft, status: data.status,
      machineId: data.machineId || "", createdAt: data.createdAt?.toDate().toISOString(), images};
  }));
  return {items, cursor: more ? items[items.length - 1].id : null};
});

export const getLaundryMachineSubmissionImage = onCall(options, async (request) => {
  if (request.auth?.token.laundryServicesAdmin !== true) {
    throw new HttpsError("permission-denied", "admin-only");
  }
  const {id, index} = request.data || {};
  if (typeof id !== "string" || !/^[a-zA-Z0-9-]{16,80}$/.test(id) ||
    !Number.isInteger(index) || index < 0 || index > 3) {
    throw new HttpsError("invalid-argument", "invalid-image");
  }
  const data = (await submissions.doc(id).get()).data();
  const image = data?.images[index];
  if (!image) throw new HttpsError("not-found", "image-not-found");
  const [bytes] = await admin.storage().bucket().file(image.path).download();
  return {content: bytes.toString("base64"), type: image.type};
});
