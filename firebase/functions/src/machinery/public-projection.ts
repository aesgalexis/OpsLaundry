/* eslint-disable max-len */
import type {Firestore} from "firebase-admin/firestore";

export const ADMIN_MACHINES = "agregador_maquinaria_LS";
export const PUBLIC_MACHINES = "laundry_public_machines";
const TEXT_FIELDS = ["categoria", "marca", "modelo", "capacidad", "estado", "ubicacion",
  "precioTexto", "garantiaTexto", "garantiaTipo", "comentarios", "calefaccion"];
const NUMBER_FIELDS = ["anio", "precioAmount", "garantiaPiezasAnos", "garantiaMeses"];

// Only scalar presentation fields and image URLs cross the public boundary.
export const projectPublicMachine = (id: string, data?: Record<string, unknown>) => {
  if (!data || data.visible === false || !data.categoria || !data.marca) return null;
  const result: Record<string, unknown> = {id, visible: true};
  for (const key of TEXT_FIELDS) {
    const value = data[key];
    result[key] = typeof value === "string" || typeof value === "number" ? String(value) : "";
  }
  for (const key of NUMBER_FIELDS) {
    const value = data[key];
    result[key] = typeof value === "string" || (typeof value === "number" && Number.isFinite(value)) ? value : null;
  }
  result.envioIncluido = data.envioIncluido !== false;
  result.puestaEnMarchaIncluida = data.puestaEnMarchaIncluida !== false;
  result.imagenes = (Array.isArray(data.imagenes) ? data.imagenes : []).flatMap((image) => {
    const url = typeof image === "string" ? image : image?.url;
    if (typeof url !== "string") return [];
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" && !parsed.username && !parsed.password ? [url] : [];
    } catch {
      return [];
    }
  });
  return result;
};

// Re-read inside the transaction: retries or out-of-order events cannot resurrect stale data.
export const reconcilePublicMachine = async (db: Firestore, id: string) => {
  const source = db.collection(ADMIN_MACHINES).doc(id);
  const target = db.collection(PUBLIC_MACHINES).doc(id);
  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(source);
    const projection = projectPublicMachine(id, current.exists ? current.data() : undefined);
    if (projection) transaction.set(target, projection);
    else transaction.delete(target);
  });
};
