/* eslint-disable max-len */
// The legal and delivery identities remain in use during the OpsLaundry transition.
export const REQUEST_DESTINATION = "info@unatomo.com";
export const VERIFIED_SENDER = "Unatomo <cuenta@correo.unatomo.com>";

const UNATOMO_LOGO_URL =
  "https://unatomo.com/static/img/logo-unatomo-round-v1.0.png";
const OPSLAUNDRY_WORDMARK_URL =
  "https://opslaundry.com/static/img/opslaundry-wordmark-email.png";

export const renderLaundryEmailBrandHeader = () =>
  `<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td><img src="${UNATOMO_LOGO_URL}" width="54" height="54"
alt="Unatomo" style="display:block;border:0"></td>
<td style="padding-left:16px"><img src="${OPSLAUNDRY_WORDMARK_URL}"
width="228" height="54" alt="OpsLaundry" style="display:block;border:0"></td>
</tr></table>`;
