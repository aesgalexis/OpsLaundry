import {setGlobalOptions} from "firebase-functions";
import * as admin from "firebase-admin";

setGlobalOptions({maxInstances: 10});

if (!admin.apps.length) {
  admin.initializeApp();
}

export {admin};
export const db = admin.firestore();
