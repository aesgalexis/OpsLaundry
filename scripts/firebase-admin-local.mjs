import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(currentDirectory, "..");

const readJsonIfExists = (filePath) => {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf8"));
};

export const getProjectRoot = () => rootDirectory;

export const getFirebaseProjectId = () => {
  const environmentProject =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT;
  if (environmentProject) return environmentProject.trim();

  const firebaseConfig = readJsonIfExists(
    path.join(rootDirectory, ".firebaserc"),
  );
  return (firebaseConfig?.projects?.default || "").toString().trim();
};

const requireFirstAvailable = (requests) => {
  for (const request of requests) {
    try {
      return request();
    } catch {
      // Keep trying the credential sources used by the existing toolchain.
    }
  }
  return null;
};

const getFirebaseCliAuth = () => {
  const projectRequire = createRequire(
    path.join(rootDirectory, "package.json"),
  );
  const functionsRequire = createRequire(
    path.join(rootDirectory, "firebase", "functions", "package.json"),
  );
  const globalFirebaseTools = process.env.APPDATA
    ? path.join(
        process.env.APPDATA,
        "npm",
        "node_modules",
        "firebase-tools",
        "lib",
        "auth",
      )
    : "";
  const candidates = [
    () => projectRequire("firebase-tools/lib/auth"),
    () => functionsRequire("firebase-tools/lib/auth"),
  ];
  if (globalFirebaseTools) {
    candidates.push(() => projectRequire(globalFirebaseTools));
  }
  return requireFirstAvailable(candidates);
};

export const getFirebaseCliAccessToken = async () => {
  const auth = getFirebaseCliAuth();
  if (!auth) {
    throw new Error(
      "Firebase CLI auth not found. Run firebase login or configure ADC.",
    );
  }

  const account =
    auth.getProjectDefaultAccount?.(rootDirectory) ||
    auth.getGlobalDefaultAccount?.();
  const refreshToken = account?.tokens?.refresh_token;
  if (!refreshToken || typeof auth.getAccessToken !== "function") {
    throw new Error("Firebase CLI login not found. Run firebase login.");
  }

  const scopes = [
    "email",
    "openid",
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/firebase",
  ];
  const token = await auth.getAccessToken(refreshToken, scopes);
  if (!token?.access_token) {
    throw new Error("Firebase CLI could not provide an access token.");
  }
  return token.access_token;
};
