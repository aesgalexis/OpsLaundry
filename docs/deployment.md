# Build y publicación

`npm run build` genera `dist/` a partir de `site/`, empaqueta el CSS y añade
snapshots públicos de maquinaria de ocasión. La salida conserva las URLs de las
páginas y el archivo `CNAME` declara `opslaundry.com`.

El workflow `.github/workflows/pages.yml` instala con `npm ci`, crea la
configuración de ejecución desde secretos del repositorio, ejecuta
`build:with-stats` y entrega `dist/` a GitHub Pages. Los secretos web configurados
son `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`,
`FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`,
`FIREBASE_MEASUREMENT_ID` y `FIREBASE_APP_CHECK_SITE_KEY`.

La publicación del sitio la inicia el propietario con:

```powershell
npm.cmd run site:publish
```

El comando genera estadísticas y build, crea un commit si hay cambios y envía
`main` a `origin`. No desplegar ni publicar sin petición explícita en el turno
actual. Las Functions y las reglas Firebase tienen despliegue separado del
sitio; `RESEND_API_KEY` es un secreto de Functions, no de GitHub Pages.

El dominio dispone de certificado y HTTPS obligatorio. El estado de los datos
y las comprobaciones posteriores se mantiene en `migration-status.md`.
