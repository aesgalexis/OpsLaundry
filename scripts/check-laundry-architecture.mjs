import {readdir, readFile, stat} from "node:fs/promises";
import {join, relative, resolve, sep} from "node:path";

const root = resolve(".");
const machineryEntry = resolve("ls_maquinaria.js");
const buildScript = resolve("scripts/build-static.mjs");
const machinerySnapshotScript = resolve("scripts/generate-laundry-machinery-pages.mjs");
const frontendDirectories = [
  "catalogo", "el", "en", "es", "it", "ls_maquinaria", "recambios",
  "solicitudes", "styles", "submissions",
];
const frontendFiles = [
  "contact.js", "ls_claim-loop.js", "ls_footer.js", "ls_machine-detail.js", "ls_maquinaria.js",
  "ls_page-nav.js", "ls_page.js", "ls_styles.css", "ls_top-bar.js",
  "static/js/contact-form-controller.js",
];
const MAX_EXECUTABLE_LINES = 500;
const MAX_EXECUTABLE_BYTES = 22_000;
const MAX_STYLESHEET_BYTES = 24_000;
const FIREBASE_BROWSER_VERSION = "12.16.0";
const forbiddenPublicData = ["recambios/catalogo-maquinas.json"];
const forbiddenLegacyFiles = [
  "i18n/common.js", "i18n/home-audit.js", "i18n/service-details.js",
  "i18n/machinery.js", "i18n/spare-parts.js", "ls_i18n.js",
  "ls_home-i18n.js", "ls_detail-i18n.js", "recambios/recambios-i18n.js",
  "ls_maquinaria/ls_machine-copy.js", "ls_maquinaria/ls_machine-images.js",
];

async function walk(directory) {
  const entries = await readdir(directory, {withFileTypes: true});
  const files = [];
  for (const entry of entries) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(file));
    else if (entry.isFile()) files.push(file);
  }
  return files;
}

const nestedFiles = (await Promise.all(frontendDirectories.map((directory) =>
  walk(resolve(directory))))).flat();
const files = [...nestedFiles, ...frontendFiles.map((file) => resolve(file))];
const relativeFiles = new Set(files.map((file) => relative(root, file).split(sep).join("/")));
const failures = forbiddenPublicData
  .filter((file) => relativeFiles.has(file))
  .map((file) => `${file}: catalogue data must live in Firestore, not in the public frontend.`);
forbiddenLegacyFiles.filter((file) => relativeFiles.has(file)).forEach((file) =>
  failures.push(`${file}: legacy duplicate module must not be restored.`));

for (const file of files.filter((file) => file.endsWith(".js"))) {
  const relativePath = relative(root, file).split(sep).join("/");
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(/firebasejs\/(\d+\.\d+\.\d+)/g)) {
    if (match[1] !== FIREBASE_BROWSER_VERSION) {
      failures.push(`${relativePath}: Firebase ${match[1]} differs from ${FIREBASE_BROWSER_VERSION}.`);
    }
  }
  const lines = source.split(/\r?\n/).length;
  const bytes = (await stat(file)).size;
  if (lines > MAX_EXECUTABLE_LINES) failures.push(`${relativePath}: ${lines} lines exceeds ${MAX_EXECUTABLE_LINES}.`);
  if (bytes > MAX_EXECUTABLE_BYTES) failures.push(`${relativePath}: ${bytes} bytes exceeds ${MAX_EXECUTABLE_BYTES}.`);
}

for (const file of files.filter((file) => file.endsWith(".css"))) {
  const bytes = (await stat(file)).size;
  if (bytes > MAX_STYLESHEET_BYTES) {
    failures.push(`${relative(root, file)}: ${bytes} bytes exceeds ${MAX_STYLESHEET_BYTES}.`);
  }
}

const machinerySource = await readFile(machineryEntry, "utf8");
if (!machinerySource.includes("ls_machine-public-store.js") ||
    machinerySource.includes('from "/ls_maquinaria/agregador/ls_machine-store.js"') ||
    machinerySource.includes('from "/ls_maquinaria/agregador/firebase-config.js"')) {
  failures.push("ls_maquinaria.js: public entry must not statically import admin/auth/storage modules.");
}
if (!machinerySource.includes("const PAGE_SIZE = 20;")) {
  failures.push("ls_maquinaria.js: public machinery pagination must remain at 20 records per page.");
}

const buildSource = await readFile(buildScript, "utf8");
if (!buildSource.includes('"ls_maquinaria/imagenes/"')) {
  failures.push("build-static.mjs: repository-only machinery images must stay out of dist.");
}
if (!buildSource.includes('"brand/archive/"')) {
  failures.push("build-static.mjs: archived brand assets must stay out of dist.");
}
if (!buildSource.includes("await bundleSiteStyles({root: ROOT, dist: DIST})")) {
  failures.push("build-static.mjs: stylesheet imports must be bundled for production.");
}
if (!buildSource.includes("generateLaundryMachineryPages")) {
  failures.push("build-static.mjs: machinery HTML snapshots must be generated during build.");
}

const snapshotSource = await readFile(machinerySnapshotScript, "utf8");
if (!snapshotSource.includes("machine.visible !== false") || !snapshotSource.includes("path.join(dist")) {
  failures.push("generate-laundry-machinery-pages.mjs: snapshots must contain only visible records and write to dist.");
}
if (!snapshotSource.includes("const PAGE_SIZE = 20;")) {
  failures.push("generate-laundry-machinery-pages.mjs: snapshot pagination must remain at 20 records.");
}

if (failures.length) {
  console.error("OpsLaundry architecture check failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log("OK: OpsLaundry frontend boundaries verified.");
