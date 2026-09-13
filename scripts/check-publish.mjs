import {readFile} from "node:fs/promises";
import {pathToFileURL} from "node:url";
import {MAX_SNAPSHOT_AGE} from "./machinery-snapshot.mjs";
import {checkArtifact} from "./check-artifact.mjs";

export function assertPublishable(report, now = Date.now()) {
  if (!["fresh", "cached"].includes(report.status) || !Number.isFinite(report.fetchedAt) ||
    report.fetchedAt > now || now - report.fetchedAt > MAX_SNAPSHOT_AGE ||
    !Number.isInteger(report.machines) || report.machines < 0 || report.generated !== report.machines * 4) {
    throw new Error("Publicación bloqueada: faltan fichas verificadas de maquinaria. Repite el build cuando Firestore esté disponible.");
  }
  if (report.status === "cached") {
    console.warn(`AVISO DE PUBLICACIÓN: fichas reconstruidas con datos públicos de ${new Date(report.fetchedAt).toISOString()}.`);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const report = JSON.parse(await readFile(".cache/machinery-build.json", "utf8"));
    assertPublishable(report);
    await checkArtifact("dist", report);
    console.log("OK: generación de maquinaria apta para publicación.");
  } catch (error) {
    console.error(error.code === "ENOENT" ? "Publicación bloqueada: ejecuta el build primero." : error.message);
    process.exitCode = 1;
  }
}
