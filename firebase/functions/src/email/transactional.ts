/* eslint-disable max-len */
import {escapeHtml} from "../spare-parts/validation";
import {renderLaundryEmailBrandHeader} from "./branding";

export const emailText = (value: unknown) => String(value ?? "").replace(/\u2014/g, ", ").trim();
const safe = (value: unknown) => escapeHtml(emailText(value));
type Section = {title: string; rows: Array<[string, string]>};

// Adapted from Unatomo's email/templates.ts shell, with OpsLaundry colours and identity.
export const renderTransactionalEmail = (input: {
  language: string; title: string; greeting: string; paragraphs: string[];
  reference: string; referenceLabel: string; sections: Section[];
  footer: string; button?: {label: string; url: string};
}) => `<!doctype html><html lang="${safe(input.language)}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>@media(max-width:600px){.mail-header{padding:24px 16px 12px!important}.mail-body{padding:12px 16px 28px!important}.mail-footer{padding:20px 16px!important}}</style>
</head><body style="margin:0;background:#f5f7fa;color:#142b4a;font-family:Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden">${safe(input.paragraphs[0])}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fa;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #d9e0e8;border-radius:16px;overflow:hidden;table-layout:fixed">
<tr><td class="mail-header" style="padding:30px 36px 12px">${renderLaundryEmailBrandHeader()}</td></tr>
<tr><td class="mail-body" style="padding:12px 36px 36px;overflow-wrap:anywhere;word-break:break-word">
<h1 style="margin:0 0 22px;font-size:20px;font-weight:600;line-height:1.35;color:#142b4a">${safe(input.title)}</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6">${safe(input.greeting)}</p>
${input.paragraphs.map((paragraph) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6">${safe(paragraph)}</p>`).join("")}
<div style="margin:22px 0;padding:15px 18px;border-radius:10px;background:#eef2f7;color:#142b4a;text-align:center">
<div style="font-size:12px;margin-bottom:6px">${safe(input.referenceLabel)}</div><strong style="font-size:15px;word-break:break-all">${safe(input.reference)}</strong></div>
${input.sections.map((section) => `<h2 style="margin:24px 0 10px;font-size:17px">${safe(section.title)}</h2>
<table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;table-layout:fixed;font-size:14px;line-height:1.5">${section.rows.map(([label, value]) => `<tr><th scope="row" style="width:38%;padding:9px 10px 9px 0;text-align:left;vertical-align:top;border-bottom:1px solid #e5e7eb;color:#526071;font-weight:400">${safe(label)}</th><td style="padding:9px 0;border-bottom:1px solid #e5e7eb;white-space:pre-wrap;vertical-align:top">${safe(value)}</td></tr>`).join("")}</table>`).join("")}
${input.button ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 6px"><tr><td style="border-radius:9px;background:#2563eb"><a href="${safe(input.button.url)}" style="display:inline-block;padding:12px 18px;color:#fff;text-decoration:none;font-size:15px;font-weight:700;line-height:1.2">${safe(input.button.label)}</a></td></tr></table>` : ""}
</td></tr><tr><td class="mail-footer" style="padding:22px 36px;background:#eef2f7;color:#526071;font-size:13px;line-height:1.5">${safe(input.footer)}<br><a href="https://opslaundry.com/" style="color:#2563eb">opslaundry.com</a></td></tr>
</table></td></tr></table></body></html>`;
