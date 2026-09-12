# Deploy Notes

GitHub Pages publishes the artifact generated in `dist/`. The custom domain is
declared by `CNAME` as `opslaundry.com`.

`.github/workflows/pages.yml` preserves the Unátomo deployment architecture:
each push to `main` installs with `npm ci`, creates `.env.local` from repository
secrets, builds `dist/` and deploys that artifact with GitHub Pages Actions.

The following GitHub repository secrets were configured and verified on
2026-09-11:

- `FIREBASE_API_KEY`;
- `FIREBASE_AUTH_DOMAIN`;
- `FIREBASE_PROJECT_ID`;
- `FIREBASE_STORAGE_BUCKET`;
- `FIREBASE_MESSAGING_SENDER_ID`;
- `FIREBASE_APP_ID`;
- `FIREBASE_MEASUREMENT_ID`.
- `FIREBASE_APP_CHECK_SITE_KEY` (added 2026-09-12).

Publishing is owner-run:

```powershell
npm.cmd run site:publish
```

The command runs code statistics and the production build, stages changes,
creates a commit when needed and pushes `main` to `origin`. Do not run it until
the owner explicitly requests publication.

Firebase rules, indexes and the six isolated Laundry Functions were deployed to
`opslaundry-2907b` on 2026-09-11. `RESEND_API_KEY` is a Firebase Functions
secret; it is not a GitHub Pages secret and must not be committed. Storage was
created in the `EU` multi-region and its rules were deployed separately.

On 2026-09-12 the 37 public used-machinery listings, six Laundry counters and
their 180 referenced images were migrated without altering Unátomo. App Check
registration is configured, but service and callable enforcement remains off
until the published client can be checked against live traffic.

The first `site:publish` push and the GitHub Pages build/deploy succeeded on
2026-09-12. The custom-domain certificate is approved and HTTPS enforcement is
enabled. The two email-producing Functions were redeployed after the site
artifact made the OpsLaundry email wordmark available.
