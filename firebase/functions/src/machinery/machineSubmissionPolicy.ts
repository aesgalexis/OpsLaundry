/* eslint-disable max-len */
import {HttpsError} from "firebase-functions/v2/https";
import {clean, normalizeRequest, validateImages} from "../spare-parts/spareRequestValidation";

export const prefixes: Record<string, string> = {
  Plegadora: "P", Lavadora: "L", Tunel: "T", Secadora: "S",
  Calandra: "C", Prensa: "R", Empaquetadora: "M", Otro: "M",
};

export const normalizeMachineDraft = (raw: Record<string, unknown>) => {
  const draft: Record<string, string | boolean> = {};
  for (const key of ["categoria", "marca", "modelo", "capacidad", "anio",
    "estado", "ubicacion", "precio", "calefaccion", "garantiaTipo",
    "garantiaDetalle", "comentarios"]) {
    draft[key] = clean(raw[key], key === "comentarios" ? 3000 : 160);
  }
  for (const key of ["envioIncluido", "puestaEnMarchaIncluida"]) {
    draft[key] = raw[key] === true;
  }
  if (!Object.prototype.hasOwnProperty.call(prefixes, String(draft.categoria)) || !draft.marca ||
    !draft.ubicacion || !draft.estado) {
    throw new HttpsError("invalid-argument", "missing-machine-fields");
  }
  if (!["Usada", "Bueno", "Muy Bueno", "Excelente", "Repasada"].includes(String(draft.estado)) ||
    !["", "Gas", "Vapor", "Aceite"].includes(String(draft.calefaccion)) ||
    (draft.capacidad && (!Number.isFinite(Number(draft.capacidad)) || Number(draft.capacidad) < 0))) {
    throw new HttpsError("invalid-argument", "invalid-machine-fields");
  }
  if (draft.anio && (!/^\d{4}$/.test(String(draft.anio)) ||
    Number(draft.anio) < 1900 || Number(draft.anio) > 2100)) {
    throw new HttpsError("invalid-argument", "invalid-year");
  }
  if (draft.precio && String(draft.precio).toLowerCase() !== "consultar" &&
    !/^\d+(\.\d{1,2})?$/.test(String(draft.precio))) {
    throw new HttpsError("invalid-argument", "invalid-price");
  }
  if (draft.garantiaTipo && !["piezas", "total"].includes(String(draft.garantiaTipo))) {
    throw new HttpsError("invalid-argument", "invalid-warranty");
  }
  if (draft.garantiaTipo && ![3, 6, 12, 24, 36].includes(Number(draft.garantiaDetalle))) {
    throw new HttpsError("invalid-argument", "invalid-warranty-duration");
  }
  return draft;
};

export const normalizeMachineSubmission = (raw: Record<string, unknown>) => {
  const contact = normalizeRequest(raw);
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(contact.submissionId) ||
    !contact.contactName || !contact.phone || !contact.privacyAccepted ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
    throw new HttpsError("invalid-argument", "invalid-contact");
  }
  validateImages(contact.images);
  return {
    id: contact.submissionId, language: contact.language,
    contact: {name: contact.contactName, email: contact.email,
      phone: contact.phone, company: contact.legalName},
    privacyAccepted: true,
    draft: normalizeMachineDraft(raw),
    images: contact.images,
  };
};

export const publicMachine = (
  draft: ReturnType<typeof normalizeMachineDraft>, id: string,
) => {
  const months = draft.garantiaTipo ? Number(draft.garantiaDetalle) : 0;
  return {
    id, categoria: draft.categoria,
    categoriaKey: String(draft.categoria).toLowerCase(),
    marca: draft.marca, modelo: draft.modelo, capacidad: draft.capacidad,
    anio: draft.anio ? Number(draft.anio) : null,
    estado: draft.estado, ubicacion: draft.ubicacion,
    precioAmount: draft.precio && String(draft.precio).toLowerCase() !== "consultar" ?
      Number(draft.precio) : null,
    precioTexto: !draft.precio ? "" :
      String(draft.precio).toLowerCase() === "consultar" ? "Consultar" : "",
    calefaccion: draft.calefaccion, comentarios: draft.comentarios,
    envioIncluido: draft.envioIncluido,
    puestaEnMarchaIncluida: draft.puestaEnMarchaIncluida,
    garantiaTipo: draft.garantiaTipo,
    garantiaMeses: months || null,
    garantiaPiezasAnos: months && months % 12 === 0 ? months / 12 : null,
    garantiaTexto: months ?
      `${months} meses de garantía${draft.garantiaTipo === "total" ? "" : " de piezas"}` : "",
    visible: true,
  };
};
