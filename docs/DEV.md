# Development

Use the same Node and npm versions declared in `.nvmrc` and `package.json`.

```powershell
npm.cmd install
npm.cmd run doctor
npm.cmd run dev
```

Before handing off a coherent change:

```powershell
npm.cmd test
npm.cmd run build
```

## Verification order

OpsLaundry development follows a code-first verification order:

1. inspect and compare the relevant source files;
2. run the narrowest applicable static check or automated test;
3. run the complete test/build commands when the scope warrants it;
4. use visual browser inspection only with an explicit owner request, or after
   at least one code-first diagnostic attempt has failed and the visual state is
   necessary to resolve the problem.

Do not open the local or published OpsLaundry site merely to confirm ordinary
changes. A local URL provided as context does not authorize visual inspection
unless the owner also asks to open, view or interact with it. Firebase, GitHub
and other external administration sites may be used when the requested task
requires work in those services.

Validate the repository catalogue without writing to Firebase:

```powershell
npm.cmd run catalog:laundry:check
```

Publishing the validated catalogue to the configured OpsLaundry project is an
explicit operational action:

```powershell
npm.cmd run catalog:laundry:sync
```

Copy `.env.example` to `.env.local` only when the new OpsLaundry Firebase web
configuration exists. Never commit `.env.local` or generated runtime config.
