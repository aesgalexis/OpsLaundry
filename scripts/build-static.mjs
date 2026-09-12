import {adminRouteAliases} from "./admin-routes.mjs";
import {cp, rm} from "node:fs/promises";
import path from "node:path";
import {bundleSiteStyles} from "./css-bundles.mjs";
import {generateMachineryPages} from "./generate-machinery-pages.mjs";

const ROOT = process.cwd();
const SITE = path.join(ROOT, "site");
const DIST = path.join(ROOT, "dist");

await rm(DIST, {recursive: true, force: true});
await cp(SITE, DIST, {recursive: true});
for (const [legacy, current] of adminRouteAliases) {
  await cp(path.join(SITE, current), path.join(DIST, legacy), {recursive: true});
}
await bundleSiteStyles({root: SITE, dist: DIST});
await generateMachineryPages({root: SITE, dist: DIST});
console.log("dist/ listo (artefacto estático público de OpsLaundry).");
