import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {app} from "/shared/firebase/core.js";

export const auth = getAuth(app);
export const authPersistenceReady = setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.warn("Firebase local auth persistence unavailable.", error);
  });

export async function loginWithGoogle() {
  await authPersistenceReady;
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  const user = result.user || null;
  return {ok: !!user, user, uid: user?.uid || ""};
}
