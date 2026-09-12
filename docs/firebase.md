# Firebase de OpsLaundry

El proyecto Firebase propio es `opslaundry-2907b`. La configuración web pública
se lee desde `.env.local` (ignorado) o desde los secretos del workflow y se
genera en `site/static/js/config/runtime-config.js` (ignorado). Nunca se
versionan secretos, cuentas de servicio, exportaciones productivas ni `dist/`.

## Contratos de datos

- `agregador_maquinaria_LS`: anuncios de maquinaria de ocasión ofrecida en el
  sitio y contadores del editor. El nombre heredado se conserva porque ya
  identifica datos desplegados.
- `laundry_public_catalog`: fabricantes y grupos de modelos para recambios.
- `laundry_machine_submissions` y los objetos privados
  `laundry-submissions/{submissionId}/...`: propuestas pendientes de revisión.
- `email_request_limits`: límites transitorios de solicitudes.
- `laundryServicesAdmin`: claim de los administradores autorizados.

Los módulos de `functions/src/machinery/` solo tratan anuncios de ocasión y sus
propuestas. No gestionan inventarios de equipos, activos de clientes ni NFC.
Los módulos de `spare-parts/` validan solicitudes de recambios; `email/` reúne
entrega Resend e identidad de los correos. Los exports de `src/index.ts`
conservan los seis nombres públicos de Functions.

Las reglas de Firestore y Storage permiten las lecturas públicas necesarias y
las escrituras administrativas autorizadas. Las propuestas y sus imágenes
privadas no admiten lectura directa desde el navegador.

## Estado operativo (2026-09-12)

Las seis Functions, reglas e índices Firestore y reglas Storage de OpsLaundry
están desplegados. El catálogo público v7 contiene 12 fabricantes y 180 grupos
fabricante/categoría/modelo. Hay 37 anuncios públicos de ocasión, seis
contadores del editor y 180 imágenes asociadas; el build genera 148 fichas en
cuatro idiomas. Los datos transitorios de límites de solicitudes no se
trasladaron.

App Check está registrado con una clave reCAPTCHA Enterprise restringida al
dominio. Su enforcement permanece desactivado hasta comprobar tráfico real del
cliente publicado. La lectura REST del build para snapshots tampoco usa un
token App Check, por lo que activar enforcement global de Firestore requiere
resolver antes ese acceso.

`RESEND_API_KEY` vive en Secret Manager de Functions. El remitente y los
destinos vigentes se explican en `email.md`.
