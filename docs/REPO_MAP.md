# Repository Map

## Root

- `index.html`: redirects the domain root to Spanish.
- `es/`, `en/`, `it/`, `el/`: physical localized public pages.
- `ls_*.js`: shared shell, navigation and machinery behavior.
- `contact.js`: localized contact-form initialization and request context.
- `ls_styles.css`: stable stylesheet import manifest.
- `styles/`: product styles split by responsibility.
- `assets/`: OpsLaundry editorial imagery and service icons.
- `brand/archive/`: retained historical brand sources; repository-only and
  explicitly excluded from the public build.
- `static/`: shared CSS contracts, Firebase browser bootstrap and images.
- `static/js/contact-form-controller.js`: original localized Formspree behavior.
- `catalogo/`: private catalogue editor.
- `solicitudes/`: private machine-submission review.
- `recambios/`: spare-parts request client and catalogue repository.
- `submissions/`: machine-submission client and review modules.
- `ls_maquinaria/`: machinery stores, editor and repository-only image archive.
- `firebase/`: isolated Laundry Functions, Firestore and Storage rules, indexes
  and the versioned public Laundry catalogue source for the OpsLaundry backend.

## Tooling

- `.github/workflows/pages.yml`: GitHub Pages build and artifact deployment.
- `scripts/build-static.mjs`: explicit GitHub Pages artifact build.
- `scripts/css-bundles.mjs`: CSS import expansion and validation.
- `scripts/generate-laundry-machinery-pages.mjs`: optional Firestore-backed
  static machinery snapshots.
- `scripts/check-laundry-architecture.mjs`: frontend boundary guard.
- `scripts/check-laundry-locales.mjs`: localized route and SEO guard.
- `scripts/sync-laundry-catalog.mjs`: validates the versioned catalogue and,
  only with the explicit sync command, publishes it to Firestore.
- `scripts/firebase-admin-local.mjs`: reduced Firebase CLI authentication helper
  used by catalogue synchronization; it contains no credentials.
- `scripts/site-publish.mjs`: owner-run build, commit and push workflow.

## Documentation

- `docs/PROJECT_OVERVIEW.md`: product scope.
- `docs/OPSLAUNDRY_ARCHITECTURE.md`: product and route boundaries.
- `docs/CSS_ARCHITECTURE.md`: stylesheet packaging.
- `docs/FIREBASE_MODEL.md`: backend ownership, security and migration contract.
- `docs/DEV.md`: local commands.
- `docs/DEPLOY_NOTES.md`: publishing contract.
- `docs/MIGRATION_INVENTORY.md`: source inventory and migration order.
