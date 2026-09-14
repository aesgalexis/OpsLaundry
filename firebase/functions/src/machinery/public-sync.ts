import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {db} from "../core/firebase";
import {ADMIN_MACHINES, reconcilePublicMachine} from "./public-projection";

export const syncLaundryPublicMachine = onDocumentWritten({
  document: `${ADMIN_MACHINES}/{machineId}`,
  retry: true,
}, async (event) => {
  await reconcilePublicMachine(db, event.params.machineId);
});
