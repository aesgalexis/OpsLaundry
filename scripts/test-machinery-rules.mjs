import {readFile} from "node:fs/promises";
import {getFirebaseCliAccessToken, getFirebaseProjectId} from "./firebase-admin-local.mjs";

// Firebase evaluates the supplied source with synthetic requests; no release or data is written.
const stage = process.argv.includes("--stage");
const content = await readFile(new URL(stage ? "../.cache/public-machinery-stage.rules" :
  "../firebase/firestore.rules", import.meta.url), "utf8");
const testCases = [];
for (const auth of [null, {uid: "ordinary", token: {}},
  {uid: "owner", token: {laundryServicesAdmin: true}}]) {
  for (const collection of ["agregador_maquinaria_LS", "laundry_public_machines",
    "laundry_public_machinery_status", "laundry_machine_submissions", "email_request_limits",
    "maquinaria_counters", "unknown_collection"]) {
    for (const method of ["get", "list", "create", "update", "delete"]) {
      const publicRead = collection.startsWith("laundry_public_") && ["get", "list"].includes(method);
      const stageRead = stage && collection === "agregador_maquinaria_LS" && ["get", "list"].includes(method);
      const adminAllowed = ["agregador_maquinaria_LS", "maquinaria_counters"].includes(collection) &&
        auth?.token?.laundryServicesAdmin === true && method !== "delete";
      testCases.push({expectation: publicRead || stageRead || adminAllowed ? "ALLOW" : "DENY",
        request: {auth, method, path: `/databases/(default)/documents/${collection}/L001`},
        resource: {data: {visible: true, createdBy: "synthetic@example.test"}}});
    }
  }
}
const token = await getFirebaseCliAccessToken();
const response = await fetch(`https://firebaserules.googleapis.com/v1/projects/${getFirebaseProjectId()}:test`, {
  method: "POST", headers: {Authorization: `Bearer ${token}`, "Content-Type": "application/json"},
  body: JSON.stringify({source: {files: [{name: "firestore.rules", content}]}, testSuite: {testCases}}),
});
const result = await response.json();
if (!response.ok) throw new Error(`Rules test HTTP ${response.status}: ${result.error?.message}`);
const failures = (result.testResults || []).filter((test) => test.state !== "SUCCESS");
if (result.issues?.some((issue) => issue.severity === "ERROR") ||
  failures.length || result.testResults?.length !== testCases.length) {
  throw new Error(JSON.stringify({issues: result.issues, failures, count: result.testResults?.length}));
}
console.log(`OK: ${testCases.length} ${stage ? "transitional" : "final"} Firebase rules evaluations passed (no deployment or data writes).`);
