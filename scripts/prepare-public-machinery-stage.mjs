import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {getProjectRoot} from "./firebase-admin-local.mjs";

// Transitional rules expose the new projection while old published clients still use the source.
// Generates local files only. The owner deploys these before the site, and final rules afterwards.
const root = getProjectRoot();
const source = await readFile(path.join(root, "firebase/firestore.rules"), "utf8");
const boundary = /match \/agregador_maquinaria_LS\/\{machineId\} \{\s*allow read: if isLaundryServicesAdmin\(\);/u;
if (!boundary.test(source)) throw new Error("Unexpected rules structure; review transition manually.");
const content = source.replace(boundary,
  "match /agregador_maquinaria_LS/{machineId} {\n      allow read: if true;");
const folder = path.join(root, ".cache");
const rulesPath = path.join(folder, "public-machinery-stage.rules");
const configPath = path.join(folder, "public-machinery-stage.firebase.json");
await mkdir(folder, {recursive: true});
await writeFile(rulesPath, content);
await writeFile(configPath, JSON.stringify({firestore: {database: "(default)", rules: rulesPath}}, null, 2));
console.log("Local transitional configuration prepared at .cache/public-machinery-stage.firebase.json. Nothing deployed.");
