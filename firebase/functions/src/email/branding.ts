/* eslint-disable max-len */
// Activate only after verifying opslaundry.com in the OpsLaundry Resend account.
export const REQUEST_DESTINATION = "info@opslaundry.com";
export const VERIFIED_SENDER = "OpsLaundry <info@opslaundry.com>";

const OPSLAUNDRY_WORDMARK_URL =
  "https://opslaundry.com/static/img/opslaundry-wordmark-email.png";

export const renderLaundryEmailBrandHeader = () =>
  `<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td><img src="${OPSLAUNDRY_WORDMARK_URL}"
width="228" height="54" alt="OpsLaundry" style="display:block;width:228px;max-width:100%;height:auto;border:0"></td>
</tr></table>`;
