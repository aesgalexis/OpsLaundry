import {readdir, readFile, stat} from "node:fs/promises";
import {join, relative, resolve, sep} from "node:path";

const site = resolve("site");
const machineryEntry = resolve(site, "features/machinery/list.js");
const buildScript = resolve("scripts/build-static.mjs");
const machinerySnapshotScript = resolve("scripts/generate-machinery-pages.mjs");
const MAX_EXECUTABLE_LINES = 500;
const MAX_EXECUTABLE_BYTES = 22_000;
const MAX_STYLESHEET_BYTES = 24_000;
const FIREBASE_BROWSER_VERSION = "12.16.0";
const failures = [];

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(file));
    else if (entry.isFile()) files.push(file);
  }
  return files;
}

const files = await walk(site);
const relativeFiles = new Set(files.map((file) => relative(site, file).split(sep).join("/")));
if (relativeFiles.has("features/spare-parts/catalogo-maquinas.json")) {
  failures.push("The operational catalogue must live in Firestore, not in the public artifact.");
}
if (relativeFiles.has("features/machinery/imagenes")) {
  failures.push("Repository-only machinery images must remain outside site/.");
}
for (const file of files.filter((item) => item.endsWith(".js") || item.endsWith(".css"))) {
  const relativePath = relative(site, file).split(sep).join("/");
  const source = await readFile(file, "utf8");
  const bytes = (await stat(file)).size;
  if (file.endsWith(".js")) {
    for (const match of source.matchAll(/firebasejs\/(\d+\.\d+\.\d+)/g)) {
      if (match[1] !== FIREBASE_BROWSER_VERSION) {
        failures.push(`${relativePath}: Firebase ${match[1]} differs from ${FIREBASE_BROWSER_VERSION}.`);
      }
    }
    const lines = source.split(/\r?\n/).length;
    if (lines > MAX_EXECUTABLE_LINES) failures.push(`${relativePath}: ${lines} lines exceeds ${MAX_EXECUTABLE_LINES}.`);
    if (bytes > MAX_EXECUTABLE_BYTES) failures.push(`${relativePath}: ${bytes} bytes exceeds ${MAX_EXECUTABLE_BYTES}.`);
  } else if (bytes > MAX_STYLESHEET_BYTES) {
    failures.push(`${relativePath}: ${bytes} bytes exceeds ${MAX_STYLESHEET_BYTES}.`);
  }
}

const machinerySource = await readFile(machineryEntry, "utf8");
const staticImports = [...machinerySource.matchAll(/\bfrom\s+["']([^"']+)["']/g)].map((match) => match[1]);
if (!staticImports.includes("/features/machinery/public-repository.js") ||
    staticImports.some((source) => /(?:admin|auth|storage|editor)/i.test(source))) {
  failures.push("Public machinery must statically import only the read-only repository, not administrator modules.");
}
if (!machinerySource.includes("const PAGE_SIZE = 20;")) {
  failures.push("Public machinery pagination must remain at 20 records per page.");
}
const buildSource = await readFile(buildScript, "utf8");
if (!buildSource.includes("await cp(SITE, DIST") || !buildSource.includes("bundleSiteStyles") ||
    !buildSource.includes("generateMachineryPages")) {
  failures.push("The build must copy site/, bundle its CSS and generate machinery snapshots.");
}
const snapshotSource = await readFile(machinerySnapshotScript, "utf8");
if (!snapshotSource.includes("machine.visible !== false") ||
    !snapshotSource.includes("const PAGE_SIZE = 20;") ||
    !snapshotSource.includes("path.join(dist")) {
  failures.push("Machinery snapshots must contain only visible records, paginate by 20 and write to dist/.");
}

if (failures.length) {
  console.error("OpsLaundry architecture check failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log("OK: OpsLaundry frontend boundaries verified.");
