import {createRequire} from "node:module";
import {isDeepStrictEqual} from "node:util";
import {getFirebaseCliAccessToken, getFirebaseProjectId} from "./firebase-admin-local.mjs";

const require = createRequire(new URL("../firebase/functions/package.json", import.meta.url));
const {Firestore} = require("firebase-admin/firestore");
const {OAuth2Client} = require("google-auth-library");
const {ADMIN_MACHINES, PUBLIC_MACHINES, projectPublicMachine, reconcilePublicMachine} =
  require("./lib/machinery/public-projection.js");
const projectId = getFirebaseProjectId();
if (projectId !== "opslaundry-2907b" && !process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error("Unexpected migration project; expected opslaundry-2907b.");
}
const apply = process.argv.includes("--apply");
const check = process.argv.includes("--check");
const authClient = new OAuth2Client();
authClient.setCredentials({access_token: await getFirebaseCliAccessToken()});
const db = new Firestore({projectId, authClient});
try {
  const [source, existing] = await Promise.all([
    db.collection(ADMIN_MACHINES).get(), db.collection(PUBLIC_MACHINES).get(),
  ]);
  const ids = new Set([...source.docs, ...existing.docs].map((doc) => doc.id));
  console.log(JSON.stringify({projectId, mode: apply ? "apply" : check ? "check" : "dry-run",
    administrative: source.size, public: existing.size,
    expectedPublic: source.docs.filter((doc) => projectPublicMachine(doc.id, doc.data())).length}));
  if (apply) {
    for (const id of ids) await reconcilePublicMachine(db, id);
  }
  if (apply || check) {
    // Include extra public documents: never accept leaked fields or orphan projections.
    const [latest, published] = await Promise.all([
      db.collection(ADMIN_MACHINES).get(), db.collection(PUBLIC_MACHINES).get(),
    ]);
    const expected = new Map(latest.docs.flatMap((doc) => {
      const data = projectPublicMachine(doc.id, doc.data());
      return data ? [[doc.id, data]] : [];
    }));
    if (published.size !== expected.size || published.docs.some((doc) =>
      !isDeepStrictEqual(doc.data(), expected.get(doc.id)))) {
      throw new Error("Projection differs from current source. Retry after synchronization; do not close rules.");
    }
    if (apply) await db.doc("laundry_public_machinery_status/current").set({schemaVersion: 1, ready: true});
    console.log("OK: public documents exactly match the permitted fields of visible machines.");
  }
} finally {
  await db.terminate();
}
