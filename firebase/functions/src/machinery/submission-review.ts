/* eslint-disable max-len */
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {admin, db} from "../core/firebase";
import {normalizeMachineDraft, prefixes, publicMachine} from "./submission-policy";

export const reviewLaundryMachineSubmission = onCall({
  enforceAppCheck: process.env.ENFORCE_APP_CHECK === "true",
  timeoutSeconds: 120, memory: "512MiB", maxInstances: 5,
}, async (request) => {
  if (request.auth?.token.laundryServicesAdmin !== true) {
    throw new HttpsError("permission-denied", "admin-only");
  }
  const {id, action} = request.data || {};
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(id || "") ||
    !["approve", "reject"].includes(action)) {
    throw new HttpsError("invalid-argument", "invalid-review");
  }
  const ref = db.collection("laundry_machine_submissions").doc(id);
  const stamp = () => admin.firestore.FieldValue.serverTimestamp();
  const reviewer = request.auth.uid;
  // Reserve the publication and ID atomically. Retries resume this same record.
  const reserved = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError("not-found", "submission-not-found");
    const data = snap.data() || {};
    if (data.status === "approved") return data;
    if (data.status === "rejected") throw new HttpsError("failed-precondition", "already-rejected");
    if (data.status === "approving") {
      if (action !== "approve") throw new HttpsError("failed-precondition", "approval-in-progress");
      return data;
    }
    if (action === "reject") {
      tx.update(ref, {status: "rejected", reviewedBy: reviewer, reviewedAt: stamp()});
      return {...data, status: "rejected"};
    }
    const draft = normalizeMachineDraft(request.data.draft || data.draft);
    const prefix = prefixes[String(draft.categoria)];
    const counter = db.collection("maquinaria_counters").doc(prefix);
    const counterSnap = await tx.get(counter);
    // Existing records predate counters in some installations.
    const catalog = await tx.get(db.collection("agregador_maquinaria_LS")
      .where(admin.firestore.FieldPath.documentId(), ">=", prefix)
      .where(admin.firestore.FieldPath.documentId(), "<", prefix + "\uf8ff"));
    const max = catalog.docs.reduce((n, d) =>
      Math.max(n, /^\d+$/.test(d.id.slice(1)) ? Number(d.id.slice(1)) : 0), 0);
    const sequence = Math.max(Number(counterSnap.data()?.lastSeq) || 0, max) + 1;
    const machineId = prefix + String(sequence).padStart(3, "0");
    tx.set(counter, {prefix, lastSeq: sequence, updatedAt: stamp()}, {merge: true});
    const update = {status: "approving", machineId, draft, reviewedBy: reviewer};
    tx.update(ref, update);
    return {...data, ...update};
  });
  if (reserved.status !== "approving") {
    return {status: reserved.status, machineId: reserved.machineId || ""};
  }
  const bucket = admin.storage().bucket();
  const images = await Promise.all(reserved.images.map(async (
    image: {path: string; type: string; name: string}, index: number,
  ) => {
    const path = `maquinaria/${reserved.machineId}/submission-${index}`;
    await bucket.file(image.path).copy(bucket.file(path));
    return {name: image.name, path,
      url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media`};
  }));
  await db.runTransaction(async (tx) => {
    const current = await tx.get(ref);
    if (current.data()?.status === "approved") return;
    if (current.data()?.status !== "approving") {
      throw new HttpsError("failed-precondition", "invalid-state");
    }
    const machineRef = db.collection("agregador_maquinaria_LS").doc(reserved.machineId);
    const machineSnap = await tx.get(machineRef);
    if (machineSnap.exists) throw new HttpsError("already-exists", "machine-id-conflict");
    tx.create(machineRef, {...publicMachine(reserved.draft, reserved.machineId),
      imagenes: images, createdBy: reserved.reviewedBy, createdAt: stamp(), updatedAt: stamp()});
    tx.update(ref, {status: "approved", reviewedAt: stamp()});
  });
  return {status: "approved", machineId: reserved.machineId};
});
