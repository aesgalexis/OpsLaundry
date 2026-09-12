# Firebase Model

The OpsLaundry Firebase project is `opslaundry-2907b`. Its public web
configuration is stored only in the ignored local `.env.local` file and is
compiled into the ignored runtime configuration during build. No Unátomo
runtime configuration, secret or production export belongs in this repository.

The public and legal contact email is `info@opslaundry.com`. The address is a
forwarding mailbox and is not assumed to be suitable as a Resend sender. The
extracted Laundry Functions therefore preserve the existing Resend delivery
behavior, verified sender `Unatomo <cuenta@correo.unatomo.com>` and destination
`info@unatomo.com` until the owner reviews that mail flow separately.
`RESEND_API_KEY` remains a Firebase Functions secret and must never be placed in
`.env.local` or committed.

The OpsLaundry backend owns these isolated contracts:

- `laundry_public_catalog`;
- `agregador_maquinaria_LS`;
- `laundry_machine_submissions`;
- private `laundry-submissions/{submissionId}/...` objects;
- request-rate-limit records;
- the `laundryServicesAdmin` custom claim;
- App Check configuration and `RESEND_API_KEY`.

The Laundry Functions source and reduced Firestore/Storage rules now live under
`firebase/`. Their build, lint and migrated behavioral tests pass locally.

Deployment status through 2026-09-12:

- Firestore rules and indexes are deployed;
- `RESEND_API_KEY` was copied directly from Unátomo into Secret Manager without
  exposing or storing its value;
- all six isolated Laundry Functions are deployed;
- the existing Google administrator account was imported without password
  material, preserving its UID and verified `laundryServicesAdmin` claim;
- Google Authentication is enabled with public project name `OpsLaundry` and
  OAuth support email `aesg.alexis@gmail.com`; this does not change the public
  and legal contact `info@opslaundry.com`;
- the Storage bucket was created in the `EU` multi-region and its rules are
  deployed;
- the seven Firebase web values are configured as encrypted GitHub Actions
  repository secrets;
- the Laundry public catalogue v7 is published in `laundry_public_catalog`
  (12 manufacturers and 180 manufacturer/category model groups), and the
  localized spare-parts form has been verified against it;
- 37 public used-machinery documents from `agregador_maquinaria_LS`, their six
  Laundry ID counters, 176 referenced Storage objects and four historical JPGs
  have been copied to OpsLaundry. One non-listing document and three unreferenced
  objects were deliberately excluded. All 180 public image URLs responded, and
  the build generated 148 localized machine detail pages.
- there were no machine-submission documents or private submission objects in
  the source to copy. Transient request-rate-limit documents were not copied;
- App Check is registered with a reCAPTCHA Enterprise score key restricted to
  `opslaundry.com`. The public site key is in the ignored local config and the
  GitHub Actions secret. Enforcement remains off until the published client is
  verified; enabling Firestore enforcement would also block the unauthenticated
  build-time machinery snapshot fetch.

Transactional HTML email headers pair the Unátomo circular logo with the
OpsLaundry text wordmark. Operational sender and destinations remain as agreed
for the transition.

No source data has been deleted or altered in Unátomo.
