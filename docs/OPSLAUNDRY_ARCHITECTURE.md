# OpsLaundry Architecture

## Scope

OpsLaundry is a static localized site with Firebase-backed used-machinery,
machine-submission and spare-parts surfaces. Editorial copy remains in physical
HTML pages; JavaScript is reserved for interaction and operational data.

## Routes

Localized routes use `/{language}/{translated-slug}/index.html`. Canonical and
alternate metadata point to `https://opslaundry.com` without the historical
`/laundryservices` prefix. Language selection is ordinary navigation.

The root `index.html` redirects to `/es/`. Private administration remains at
`/catalogo/` and `/solicitudes/` and must stay `noindex`.

## Frontend boundaries

- `ls_top-bar.js`, `ls_page.js`, `ls_page-nav.js` and `ls_footer.js` control
  shell behavior. Localized section labels live in each page's
  `data-section-label`, producing the shared `OpsLaundry / Section` identity.
- Contact pages retain the original Unátomo form structure and controller,
  adapted only to the fixed Laundry Services subject and OpsLaundry routes.
- `ls_maquinaria.js` imports only the read-only public store statically.
- Authentication, Storage and editor code load only after the administrator
  claim is confirmed.
- Spare-parts and machine-submission pages load Firebase runtime configuration
  only where data access is required.
- Firestore remains the source of truth. No operational catalogue may be
  embedded in public JavaScript or JSON.

## Static machinery snapshots

The build may read visible public machinery and prerender the first 20 records
plus localized detail pages. Failure to reach Firebase must not block the build.
Generated snapshots live only in `dist/`.

## Firebase backend

`firebase/functions/src/index.ts` exports only the Laundry callables and
trigger: spare-part delivery, machine submission, notification, private review
and publication. The Resend secret contract, verified sender and destination
are preserved without importing Unátomo's unrelated account-email outbox.

Firestore and Storage rules expose only the public Laundry catalogue and public
machinery reads. Private proposals, images and rate-limit records remain closed
to browser access; administrative writes require the `laundryServicesAdmin`
claim.

## Guardrails

Run `npm run test:laundry`. Executable frontend modules are capped at 500 lines
and 22 KB; stylesheets are capped at 24 KB. Repository-only imagery under
`ls_maquinaria/imagenes/` must never enter the public artifact.

Repository verification is code-first. Source inspection, focused automated
checks and build output are the normal evidence for changes. Browser access to
the local or published OpsLaundry UI is exceptional: it requires an explicit
owner request in the current turn, or a prior unsuccessful code-first attempt
that leaves visual inspection technically necessary. External Firebase or
GitHub administration requested by the owner is outside this UI restriction.
