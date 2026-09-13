import {adminRouteAliases} from "./admin-routes.mjs";
import {cp, rm, mkdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {bundleSiteStyles} from "./css-bundles.mjs";
import {generateMachineryPages} from "./generate-machinery-pages.mjs";
import {renderSiteShell} from "./render-shell.mjs";
import {checkArtifact} from "./check-artifact.mjs";

const ROOT = process.cwd();
const SITE = path.join(ROOT, "site");
const DIST = path.join(ROOT, "dist");
const CACHE = path.join(ROOT, ".cache");

if (path.dirname(DIST) !== ROOT || path.basename(DIST) !== "dist") throw new Error("Unsafe build output path");
await mkdir(CACHE, {recursive: true});
await rm(path.join(CACHE, "machinery-build.json"), {force: true});
await rm(DIST, {recursive: true, force: true});
await cp(SITE, DIST, {recursive: true});
for (const [legacy, current] of adminRouteAliases) {
  await cp(path.join(SITE, current), path.join(DIST, legacy), {recursive: true});
}
await bundleSiteStyles({root: SITE, dist: DIST});
const machinery = await generateMachineryPages({root: SITE, dist: DIST, cacheFile: path.join(CACHE, "machinery-snapshot.json")});
await renderSiteShell(DIST);
await checkArtifact(DIST, machinery);
await writeFile(path.join(CACHE, "machinery-build.json"), JSON.stringify(machinery), "utf8");
console.log("dist/ listo (artefacto estático público de OpsLaundry).");
