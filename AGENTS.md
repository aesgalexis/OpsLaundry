# Agent Operating Notes

This is the active OpsLaundry repository. Preserve Spanish, English, Italian
and Greek wherever the public site supports them.

## Orientation

- Start broad work with `docs/repository-map.md`.
- Read `docs/architecture.md` before changing routes, machinery,
  spare-parts requests, submissions or catalogue administration.
- Read `docs/styles.md` before changing shared styles or packaging.
- Read `docs/deployment.md` before publishing or changing the build flow.
- Read `docs/firebase.md` before changing Firebase configuration, data,
  rules, Functions, Storage, App Check or administrator claims.

## Working rules

- Do not add libraries, frameworks or tools without explicit owner approval.
- Preserve the established static HTML/CSS/JavaScript architecture and the
  owner-run `npm run site:publish` workflow.
- Work code-first. Inspect source, compare the extracted implementation, run
  focused checks and use build/test output before opening OpsLaundry in a
  browser or otherwise inspecting it visually.
- Do not open, navigate, screenshot or interact with the local or published
  OpsLaundry site as routine verification. Visual access is allowed only when
  the owner explicitly requests it in the current turn, or when a code-first
  diagnostic attempt has already failed and visual inspection is genuinely
  necessary to continue. A URL supplied only as context is not by itself a
  request for visual inspection.
- External administration surfaces such as Firebase or GitHub may be opened
  when the owner has requested work there. This exception does not extend to
  browsing OpsLaundry itself.
- Publishing and Firebase deployment are owner-run operations. Do not publish
  or deploy unless explicitly requested in the current turn.
- Never copy or commit `.env.local`, secrets, service accounts, production
  exports, `node_modules`, `dist` or generated Functions output.
- Keep the public site independent from Unátomo. Legal entity references may
  remain only where legally required and owner-confirmed.
- Preserve unrelated owner changes and keep migrations reversible until the
  new site and backend have been verified.
