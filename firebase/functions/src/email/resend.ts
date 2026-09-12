import {defineSecret} from "firebase-functions/params";

// The Laundry workflows own delivery; this module keeps the existing Firebase
// secret contract without bringing Unátomo's unrelated email outbox into this
// project.
export const resendApiKey = defineSecret("RESEND_API_KEY");
