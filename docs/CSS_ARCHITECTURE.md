# CSS Architecture

`ls_styles.css` is the stable public entry point and owns cascade order. Its
imports are divided by concern under `styles/`, with isolated feature CSS under
`recambios/`, `catalogo/`, `submissions/` and `ls_maquinaria/`.

Shared button, form and size/color contracts remain under `static/css/` using
their existing filenames during the parity migration. The production build
expands local imports and minifies the resulting `ls_styles.css` without
rewriting public asset URLs.

The localized contact pages use the original form DOM contract: `.form-grid`,
paired `label[for]` controls, `.form-consent-label > input + span`,
`.ut-form-status` and `.ut-form-actions`. These wrappers are structural; removing
them breaks spacing, consent layout and button placement even when the CSS files
are still present.

Run `npm run check:css` after changing imports, cascade order or shared styles.
