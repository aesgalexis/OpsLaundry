import {mkdir, readFile, writeFile, rename} from "node:fs/promises";
import path from "node:path";
import {createHash} from "node:crypto";
import {publicImageUrl} from "../site/features/machinery/presentation.mjs";

export const MAX_SNAPSHOT_AGE = 7 * 24 * 60 * 60 * 1000;
const TEXT_FIELDS = ["id", "categoria", "marca", "modelo", "capacidad", "estado", "ubicacion",
  "precioTexto", "garantiaTexto", "garantiaTipo", "comentarios", "calefaccion"];
const NUMBER_FIELDS = ["anio", "precioAmount", "garantiaPiezasAnos", "garantiaMeses"];

// Explicit allowlist: no creator identities, private submissions, Storage paths or raw exports.
export function publicMachines(machines) {
  if (!Array.isArray(machines)) throw new Error("Invalid public machinery response");
  const ids = new Set();
  return machines.filter((machine) => machine && machine.visible !== false &&
    machine.id && machine.categoria && machine.marca).map((machine) => {
    const result = {};
    for (const key of TEXT_FIELDS) result[key] = String(machine[key] ?? "");
    if (!/^[A-Za-z0-9_-]+$/u.test(result.id) || ids.has(result.id)) {
      throw new Error("Invalid or duplicate public machine id");
    }
    ids.add(result.id);
    for (const key of NUMBER_FIELDS) {
      const value = machine[key];
      result[key] = typeof value === "string" ? value : Number.isFinite(value) ? value : null;
    }
    result.envioIncluido = machine.envioIncluido !== false;
    result.puestaEnMarchaIncluida = machine.puestaEnMarchaIncluida !== false;
    result.visible = true;
    result.imagenes = (Array.isArray(machine.imagenes) ? machine.imagenes : [])
      .map(publicImageUrl).filter(Boolean);
    return result;
  });
}
const checksum = (machines) => createHash("sha256").update(JSON.stringify(machines)).digest("hex");
export async function loadSnapshot(file, projectId, now = Date.now()) {
  if (!file) return null;
  try {
    const cache = JSON.parse(await readFile(file, "utf8"));
    if (cache.version !== 1 || cache.projectId !== projectId ||
      !Number.isFinite(cache.fetchedAt) || cache.fetchedAt > now || now - cache.fetchedAt > MAX_SNAPSHOT_AGE ||
      cache.checksum !== checksum(cache.machines)) return null;
    const machines = publicMachines(cache.machines);
    if (machines.length !== cache.machines.length) return null;
    return {machines, fetchedAt: cache.fetchedAt};
  } catch { return null; }
}
export async function saveSnapshot(file, projectId, machines, fetchedAt) {
  if (!file) return;
  const publicData = publicMachines(machines);
  await mkdir(path.dirname(file), {recursive: true});
  const temporary = `${file}.tmp`;
  await writeFile(temporary, JSON.stringify({version: 1, projectId, fetchedAt,
    checksum: checksum(publicData), machines: publicData}), "utf8");
  await rename(temporary, file);
}
