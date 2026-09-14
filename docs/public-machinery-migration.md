# Separación de maquinaria pública y administrativa

## Estado del 14/09/2026

La sincronización y las reglas transitorias están desplegadas. Las 37
proyecciones públicas están cargadas y verificadas; build y check:publish
correctos con 148 fichas y 192 URLs. Pendiente publicar el nuevo lector y
después cerrar la colección administrativa. La consulta autenticada de las
reglas desplegadas confirmó lectura pública de `agregador_maquinaria_LS`.
El ensayo de solo lectura encontró 37 documentos administrativos, 0 públicos y
37 proyecciones previstas. No se exportaron documentos ni credenciales.

La colección `agregador_maquinaria_LS` conserva los documentos originales y el
editor. `laundry_public_machines` contiene exclusivamente campos de presentación
y URLs HTTPS de imágenes de los anuncios visibles. No copia identidades,
fechas administrativas, contactos, nombres de archivos ni campos de rutas de
Storage. Las URLs públicas conservan necesariamente su dirección y token de
descarga existentes: esta migración no revoca imágenes ya publicadas.

`syncLaundryPublicMachine` escucha escrituras en la colección administrativa.
Relee el documento actual dentro de una transacción y reemplaza completamente
la proyección, o la elimina si el anuncio está oculto o ya no existe. Tolera
eventos repetidos/desordenados y reintenta fallos. La propagación es asíncrona.
Las seis Functions existentes mantienen sus nombres y contratos.

La web y el build leen la colección pública. El listado administrativo cambia
de fuente tras comprobar el claim, permite editar/reactivar máquinas ocultas y
limpia sus datos al cambiar de sesión. El build requiere el marcador
`laundry_public_machinery_status/current` con `ready: true, schemaVersion: 1`.
Las copias locales y de Actions pasan a versión 2; no se reutilizan snapshots
anteriores a la separación para superar la comprobación inicial.

El puente temporal de Vite se ha retirado tras cargar la proyección pública.
Desarrollo y producción usan ahora el mismo lector público.

## Comprobaciones

`npm test` incluye pruebas de campos privados, retirada, reactivación,
reconciliación repetida, cambios de sesión y bloqueo antes de la carga inicial.
`node scripts/test-machinery-rules.mjs` envía solo las reglas y 105 solicitudes
sintéticas a la API oficial de evaluación de Firebase; no despliega ni escribe
documentos. Esta evaluación quedó pendiente: la revisión automática rechazó
enviar el código de reglas sin autorización explícita para ese destino.

La variante `--stage` valida las reglas transitorias generadas con
`node scripts/prepare-public-machinery-stage.mjs`. Cada variante comprueba
acceso anónimo, usuario ordinario y administrador, incluidos contadores y
colecciones desconocidas. Ambas evaluaciones deben pasar antes del despliegue.

Comprobación local posterior del 14/09: `npm test` correcto; sintaxis del
evaluador correcta. `npm run build` termina con 0 fichas al no obtener un
snapshot público válido; `npm run check:publish` bloquea ese artefacto.
La evaluación remota se volvió a solicitar y la revisión automática la rechazó
por requerir autorización explícita para enviar las reglas a
`firebaserules.googleapis.com`. No se desplegó ni modificó la base de datos.

`npm run build` puede terminar sin fichas antes de la migración, pero
`npm run check:publish` debe fallar. Es un bloqueo deliberado, no una versión
apta para publicación. No se ha inspeccionado visualmente el sitio.

## Aplicación por fases (propietario)

El propietario autorizó explícitamente evaluación remota y despliegues el
14/09. Las 105 evaluaciones finales y las 105 transitorias pasaron antes del
despliegue. Esto resuelve el bloqueo de autorización descrito arriba.

No ejecutar un despliegue global de Firebase. No cerrar la colección original
antes de completar la nueva publicación del sitio.

1. Ejecutar `npm test`, `node scripts/prepare-public-machinery-stage.mjs`,
   `node scripts/test-machinery-rules.mjs` y
   `node scripts/test-machinery-rules.mjs --stage`. Deben pasar.
2. Ejecutar `firebase deploy --only functions:syncLaundryPublicMachine --project opslaundry-2907b`.
   Confirmar éxito de la nueva Function antes de cargar la proyección.
3. Ejecutar `node scripts/prepare-public-machinery-stage.mjs`, y después
   `firebase deploy --only firestore:rules --config .cache/public-machinery-stage.firebase.json --project opslaundry-2907b`.
   Estas reglas transitorias mantienen la lectura anterior y abren únicamente
   las nuevas colecciones públicas para lectura. El archivo definitivo sigue
   restringiendo la colección original a administradores.
4. Ejecutar `node scripts/migrate-public-machines.mjs` para comprobar conteos;
   `node scripts/migrate-public-machines.mjs --apply` para reconciliar; y
   `node scripts/migrate-public-machines.mjs --check` para verificar igualdad.
   El script usa el token temporal de la sesión CLI en memoria. `--apply` solo
   escribe proyecciones y el marcador de preparación, nunca la colección fuente.
   Repetir es seguro; se eliminan proyecciones huérfanas y campos sobrantes.
5. Ejecutar `npm run build` y `npm run check:publish`. Exigir datos frescos y
   verificar el número de fichas en los cuatro idiomas. Revisar el diff antes
   de `npm run site:publish`, que publica todos los cambios pendientes mediante
   el flujo habitual. Esperar el éxito de GitHub Actions y comprobar que la
   versión publicada usa `laundry_public_machines`.
6. Ejecutar de nuevo `--check` y desplegar las reglas finales con
   `firebase deploy --only firestore:rules --project opslaundry-2907b`.
7. Comprobar mediante API que la lectura anónima de la colección original
   devuelve permiso denegado y que la pública conserva los anuncios previstos.
   Confirmar lectura/escritura administrativa con el claim. Los visitantes con
   JavaScript antiguo abierto deberán recargar la página tras el cierre.

## Recuperación y límites

Antes de cerrar permisos se puede mantener el sitio anterior con las reglas
transitorias. Después, conservar la nueva fuente pública durante cualquier
rollback del frontend: volver al lector antiguo rompería la lectura anónima.
Reabrir la colección interna reintroduciría la exposición y no es el rollback
por defecto. La fuente original permanece intacta y permite reconstruir la
proyección con `--apply` ante una incidencia.

Retirar un anuncio elimina su proyección tras la sincronización. El HTML y el
sitemap estáticos requieren una nueva publicación; la ficha abierta recibe la
retirada y actualiza sus metadatos. Imágenes descargadas o URLs ya compartidas
no se revocan. La retirada de objetos de Storage requiere una decisión aparte.
Esta separación no cambia Hosting ni activa App Check.
