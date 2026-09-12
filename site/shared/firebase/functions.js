import {getFunctions} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js";
import {app} from "/shared/firebase/core.js";

export const functions = getFunctions(app);
