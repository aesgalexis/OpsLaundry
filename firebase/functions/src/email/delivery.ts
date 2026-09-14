import {logger} from "firebase-functions";
import {HttpsError} from "firebase-functions/v2/https";
import {resendApiKey} from "./resend";
import {ResendPayload} from "../spare-parts/types";

export const sendLaundryEmail = async (
  payload: ResendPayload,
  idempotencyKey: string,
  logLabel: string,
) => {
  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey.value()}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    logger.error(`${logLabel} network error`, {
      event: "email_transport_failed", channel: logLabel,
    });
    throw new HttpsError("unavailable", "email-send-failed");
  }
  await response.body?.cancel().catch(() => undefined);
  if (!response.ok) {
    logger.error(`${logLabel} rejected by Resend`, {
      event: "email_provider_rejected", channel: logLabel,
      status: response.status,
    });
    throw new HttpsError("unavailable", "email-send-failed");
  }
  logger.info(`${logLabel} accepted by Resend`, {
    event: "email_provider_accepted", channel: logLabel,
  });
};
