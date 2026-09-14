# Build y publicación

Antes de la próxima publicación, completar las fases iniciales de
`public-machinery-migration.md`: nueva Function, reglas transitorias y carga
verificada de la proyección pública. El build ya usa la nueva colección y
bloquea la publicación si falta su marcador. Las reglas privadas definitivas
se despliegan únicamente después de publicar y verificar el nuevo lector.

`npm run build` genera `dist/` a partir de `site/`, empaqueta el CSS y añade
snapshots públicos de maquinaria de ocasión. La salida conserva las URLs de las
páginas y el archivo `CNAME` declara `opslaundry.com`.

El workflow `.github/workflows/pages.yml` instala con `npm ci`, crea la
configuración de ejecución desde secretos del repositorio, comprueba CSS,
frontend, idiomas, enlaces y secretos, ejecuta `build:with-stats` y
`check:publish`, y entrega `dist/` a GitHub Pages. Un job previo verifica las
Functions con Node 24, su runtime declarado. Los secretos web configurados
son `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`,
`FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`,
`FIREBASE_MEASUREMENT_ID` y `FIREBASE_APP_CHECK_SITE_KEY`.

La publicación del sitio la inicia el propietario con:

```powershell
npm run site:publish
```

El comando ejecuta `npm test`, genera estadísticas y build, verifica
`check:publish`, crea un commit si hay cambios y envía
`main` a `origin`. No desplegar ni publicar sin petición explícita en el turno
actual. Las Functions y las reglas Firebase tienen despliegue separado del
sitio; `RESEND_API_KEY` es un secreto de Functions, no de GitHub Pages.

## Recuperación de fichas

El build guarda exclusivamente los campos públicos necesarios para representar
los anuncios en `.cache/machinery-snapshot.json`. No contiene credenciales,
identidades de administradores, propuestas privadas ni rutas internas de
Storage. La carpeta `.cache/` está ignorada y nunca se copia a `dist/`.
GitHub Actions restaura y guarda únicamente ese archivo mediante la caché de
Actions. Su primera ejecución necesita una lectura correcta de Firestore para
crear la copia inicial.

Si Firestore falla, el build puede reconstruir las fichas desde la última copia
del mismo proyecto con integridad válida y no más de siete días. El aviso
indica la fecha original; reutilizar la copia no renueva su fecha. Los precios
y disponibilidad publicados pueden conservar esa antigüedad hasta que el
cliente reciba los datos actuales o se publique un build con una lectura nueva.
Una copia caducada, corrupta o de otro proyecto se descarta. Si no hay copia
válida, el build local sigue disponible, pero la publicación queda bloqueada
antes del commit/push local o de subir el artefacto en Actions.

`.cache/machinery-build.json` registra el resultado del último build completo.
`npm run check:publish` exige ese resultado y vuelve a comprobar el artefacto.
Tras resolver una incidencia de Firestore, basta repetir `npm run build` y
`npm run check:publish`. Estos dos comandos no publican el sitio.

El dominio dispone de certificado y HTTPS obligatorio. El estado de los datos
y las comprobaciones posteriores se mantiene en `migration-status.md`.

`npm run check:production` ejecuta una muestra pública limitada y compara el
sitemap con los anuncios visibles actuales, sin escribir en producción. Su
informe queda en `.cache/production-check.json`. No se añade a cada build ni
se programa automáticamente. La revisión y los límites de esta comprobación
están en `site-review-2026-09-13.md`.

El disparo manual `workflow_dispatch` existente permite regenerar el HTML de
`main` sin push de código. Sigue siendo una publicación que debe iniciar el
propietario. El puente desde administración está definido en la revisión,
pero no está implementado ni desplegado.
