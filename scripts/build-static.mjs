import {cp, mkdir, rm, copyFile} from "node:fs/promises";
import path from "node:path";
import {bundleSiteStyles} from "./css-bundles.mjs";
import {generateLaundryMachineryPages} from "./generate-laundry-machinery-pages.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const PUBLIC_FILES = [
  ".nojekyll", "404.html", "CNAME", "index.html", "robots.txt", "sitemap.xml",
  "contact.js", "ls_claim-loop.js", "ls_footer.js", "ls_machine-detail.js", "ls_maquinaria.js",
  "ls_page-nav.js", "ls_page.js", "ls_styles.css", "ls_top-bar.js",
];
const PUBLIC_DIRECTORIES = [
  "assets", "catalogo", "el", "en", "es", "it", "ls_maquinaria",
  "recambios", "solicitudes", "static", "styles", "submissions",
];
const PUBLIC_EXCLUDED_PREFIXES = [
  "brand/archive/",
  "ls_maquinaria/imagenes/",
];
const toRelativePath = (filePath) => path.relative(ROOT, filePath).split(path.sep).join("/");
const shouldCopy = (filePath) => {
  const relativePath = toRelativePath(filePath);
  return !PUBLIC_EXCLUDED_PREFIXES.some((prefix) =>
    relativePath === prefix.slice(0, -1) || relativePath.startsWith(prefix));
};

await rm(DIST, {recursive: true, force: true});
await mkdir(DIST, {recursive: true});
for (const file of PUBLIC_FILES) {
  const source = path.join(ROOT, file);
  const destination = path.join(DIST, file);
  await mkdir(path.dirname(destination), {recursive: true});
  await copyFile(source, destination);
}
for (const directory of PUBLIC_DIRECTORIES) {
  await cp(path.join(ROOT, directory), path.join(DIST, directory), {
    recursive: true,
    filter: shouldCopy,
  });
}
await bundleSiteStyles({root: ROOT, dist: DIST});
await generateLaundryMachineryPages({root: ROOT, dist: DIST});
console.log("dist/ listo (artefacto estático público de OpsLaundry).");
