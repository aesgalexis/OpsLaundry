import {getFirebaseCliAccessToken, getFirebaseProjectId} from "./firebase-admin-local.mjs";

const project = getFirebaseProjectId();
const token = await getFirebaseCliAccessToken();
async function get(url) {
  const response = await fetch(url, {headers: {Authorization: `Bearer ${token}`}, signal: AbortSignal.timeout(20000)});
  const data = await response.json();
  if (!response.ok) throw new Error(`Cloud readiness HTTP ${response.status}: ${data.error?.message}`);
  return data;
}
const details = await get(`https://cloudresourcemanager.googleapis.com/v1/projects/${project}`);
const services = await get(`https://firebaseappcheck.googleapis.com/v1/projects/${details.projectNumber}/services`);
console.log(JSON.stringify({project, projectNumber: details.projectNumber,
  appCheck: services.services?.map(({name, enforcementMode}) => ({name, enforcementMode}))}, null, 2));
