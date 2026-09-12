# Inventario inicial de migración a OpsLaundry

Fecha del inventario: 2026-09-11

Origen analizado: `C:\proyectos\unatomo`

Destino: `C:\proyectos\OpsLaundry`

Repositorio remoto indicado por el propietario: `https://github.com/aesgalexis/OpsLaundry`

## Estado de ejecución

Primer bloque completado el 2026-09-11:

- repositorio local conectado a `origin/main`;
- frontend de Laundry Services extraído sin modificar Unátomo;
- rutas públicas trasladadas a la raíz localizada de OpsLaundry (`/es/`, `/en/`,
  `/it/` y `/el/`), sin el prefijo histórico `/laundryservices`;
- marca, metadatos, canonical, hreflang, sitemap, robots, CNAME y página 404
  adaptados a `opslaundry.com`;
- páginas de contacto propias creadas en los cuatro idiomas con la integración
  de formulario original completa, su controlador, shell compartido y contrato
  estructural de estilos;
- catálogo público Laundry v7 incorporado como fuente controlada del proyecto,
  validado y publicado en la colección aislada `laundry_public_catalog` de
  OpsLaundry;
- scripts, versiones y dependencias conservados según el proyecto de origen,
  sin incorporar herramientas ni librerías nuevas;
- documentación base, compilación, pruebas de arquitectura, enlaces, idiomas,
  CSS y secretos preparadas y verificadas;
- configuración web local conectada a `opslaundry-2907b`;
- Functions de recambios y propuestas de maquinaria extraídas junto con sus
  pruebas, reglas específicas y contrato de secreto Resend;
- workflow de GitHub Pages trasladado para reconstruir `dist/` e inyectar la
  configuración pública desde secretos del repositorio;
- revisión visual realizada en portada, contacto y maquinaria de ocasión.

Pendiente antes de considerar publicable este bloque:

- realizar una última revisión funcional con datos reales;
- publicar mediante el flujo habitual del propietario.

Actualización 2026-09-12: la maquinaria de ocasión se ha migrado de forma
selectiva. Se copiaron 37 anuncios que cumplen el contrato del listado público,
seis contadores usados por el editor Laundry, 176 objetos Storage referenciados
y cuatro JPG locales asociados a esos anuncios. Un documento sin campos de
listado y tres objetos sin referencia quedaron fuera. No había propuestas ni
archivos privados de propuestas en el origen. Los 180 enlaces de imagen
responden y la build genera 148 fichas en los cuatro idiomas. App Check está
registrado con clave restringida a `opslaundry.com`, sin enforcement hasta
comprobar el cliente publicado. El remitente y los destinos de correo
operativos de Unátomo se mantienen temporalmente por decisión del propietario;
el encabezado HTML de los correos incluye ambos logotipos.

La configuración web del proyecto `opslaundry-2907b` ya está incorporada de
forma local en `.env.local`, que permanece ignorado por Git. El correo público
y legal es `info@opslaundry.com`; al ser un buzón de reenvío, no se ha cambiado
el remitente ni el destino operativo de Resend hasta revisar ese flujo aparte.

Estado remoto verificado el 2026-09-11: reglas e índices Firestore desplegados,
secreto Resend copiado, seis Functions Laundry desplegadas, bucket Storage
europeo creado con sus reglas, proveedor Google habilitado y cuenta Google
administrativa importada con el mismo UID y la claim `laundryServicesAdmin`.
Los siete valores web Firebase también están configurados como secretos cifrados
del repositorio para el workflow de GitHub Pages. El catálogo público v7 está
publicado con 12 fabricantes y 180 grupos de modelos; el formulario localizado
de recambios carga sus opciones y encadena marca, tipo y modelo correctamente.

Hasta completar esos puntos no se ha ejecutado `npm run site:publish`, ni se ha
publicado o limpiado ningún recurso de Unátomo.

## Principios acordados

- OpsLaundry será un proyecto y repositorio independiente.
- Se conservará la forma de trabajo actual de Unátomo: documentación Markdown,
  arquitectura explícita, build estático y publicación mediante
  `npm run site:publish`.
- No se añadirán herramientas, librerías ni frameworks nuevos.
- La migración y sus verificaciones se harán primero desde el código, las
  comparaciones, las pruebas y la build. No se abrirá ni manipulará visualmente
  OpsLaundry como comprobación rutinaria; solo se hará por petición explícita
  del propietario o cuando un intento técnico previo haya fallado y la vista
  sea necesaria para continuar. Las consolas externas solicitadas, como
  Firebase o GitHub, quedan fuera de esta restricción.
- Se reutilizarán las versiones, scripts y patrones existentes únicamente en la
  medida necesaria para Laundry Services.
- Durante la extracción no se modificará el repositorio `unatomo`.
- La retirada de Laundry Services de Unátomo se hará después de verificar y
  publicar OpsLaundry.

## Estado del origen

- Rama de Unátomo: `main`.
- Remoto de Unátomo: `https://github.com/aesgalexis/unatomo.git`.
- Al iniciar, Git informó transitoriamente de una modificación en
  `laundryservices/styles/editorial.css`, pero no existía diff y la comprobación
  final dejó el repositorio de origen limpio. No se modificó ningún archivo de
  Unátomo durante el inventario.
- `laundryservices/` contiene 94 archivos y ocupa 5.808.164 bytes (5,54 MiB):
  47 HTML, 21 JavaScript, 15 CSS, 7 WebP y 4 JPG.

## Superficie pública localizada

La web actual usa páginas HTML físicas y contenido estático en cuatro idiomas.
JavaScript gestiona interacción y datos, pero no traduce el contenido editorial.

| Área | Español | Inglés | Italiano | Griego |
| --- | --- | --- | --- | --- |
| Inicio | `/es/` | `/en/` | `/it/` | `/el/` |
| Asistencia | `/es/asistencia-tecnica/` | `/en/technical-support/` | `/it/assistenza-tecnica/` | `/el/techniki-ypostirixi/` |
| Auditoría | `/es/auditoria/` | `/en/technical-audit/` | `/it/audit-tecnico/` | `/el/technikos-elegchos/` |
| Automatización | `/es/automatizacion/` | `/en/automation/` | `/it/automazione/` | `/el/aftomatismoi/` |
| Inversiones | `/es/inversiones/` | `/en/investments/` | `/it/investimenti/` | `/el/ependyseis/` |
| Maquinaria | `/es/maquinaria-ocasion/` | `/en/used-machinery/` | `/it/macchinari-usati/` | `/el/metacheirismena-michanimata/` |
| Recambios | `/es/recambios/` | `/en/spare-parts/` | `/it/ricambi/` | `/el/antallaktika/` |
| Envío de máquina | `/es/enviar-maquina/` | `/en/submit-machine/` | `/it/invia-macchina/` | `/el/ypovoli-michanimatos/` |
| Privacidad | `/es/privacidad/` | `/en/privacy/` | `/it/privacy/` | `/el/aporrito/` |

En OpsLaundry estas rutas pueden conservar su parte localizada eliminando el
prefijo histórico `/laundryservices`. El `index.html` raíz deberá redirigir a la
portada localizada elegida, siguiendo el patrón actual.

También existen redirecciones heredadas sin idioma para asistencia, auditoría,
automatización, inversiones, maquinaria, recambios y privacidad. Debe decidirse
si siguen teniendo utilidad en el dominio nuevo; no son contenido principal.

### Hueco funcional detectado

Existen directorios vacíos para las rutas de contacto localizadas:
`es/contacto`, `en/contact`, `it/contatto` y `el/epikoinonia`. Muchas llamadas a
la acción apuntan actualmente a esas rutas del sitio general de Unátomo. Para
lograr separación pública completa, OpsLaundry necesitará sus propias páginas
de contacto en esos cuatro destinos o una sustitución equivalente con la misma
arquitectura existente.

## Frontend que pertenece directamente a Laundry Services

Debe extraerse la carpeta `laundryservices/`, conservando inicialmente su
estructura interna:

- shell compartido: `ls_top-bar.js`, `ls_page.js`, `ls_page-nav.js` y
  `ls_footer.js`;
- manifiesto de estilos: `ls_styles.css`;
- estilos divididos por responsabilidad en `styles/`;
- maquinaria pública y detalle: `ls_maquinaria.js`, `ls_machine-detail.js` y
  `ls_maquinaria/agregador/ls_machine-public-store.js`;
- administración de maquinaria: `firebase-config.js`, `ls_machine-store.js`,
  `ls_machine-add.js`, `ls_machine-add.css` y `ls_machine-id.js`;
- propuestas de maquinaria: `submissions/` y la revisión privada en
  `solicitudes/`;
- solicitudes de recambios: `recambios/`;
- editor privado del catálogo: `catalogo/`;
- recursos visuales propios en `assets/`.

El archivo `ls_styles.css` es un manifiesto estable de imports. La build actual
lo concatena y minifica; esta frontera debe conservarse.

### Archivo histórico no publicable

`laundryservices/ls_maquinaria/imagenes/` contiene cuatro JPG de archivo local,
unos 4,55 MiB. La build actual los excluye de `dist/`. Deben preservarse como
material de repositorio solo si siguen siendo necesarios; no deben publicarse.

## Dependencias compartidas fuera de `laundryservices/`

El micrositio no es completamente autónomo. Usa estos recursos de Unátomo:

### JavaScript y configuración

- `static/js/config/runtime-config.js`
- `static/js/firebase/firebaseApp.js`
- `static/js/firebase/firebasePublicDb.js`
- `static/js/registro/firebase-init.js`
- `static/js/site-page-nav.js`

`firebaseApp.js`, `firebasePublicDb.js` y `firebase-init.js` tienen a su vez
dependencias internas, por lo que la extracción debe incluir su pequeño árbol
real de imports, no solo esos tres archivos de entrada.

### CSS compartido

- `static/css/components/unatomo-buttons.css`
- `static/css/components/unatomo-forms.css`
- `static/css/tokens/unatomo-action-colors.css`
- `static/css/tokens/unatomo-control-sizes.css`

Se copiarán como contratos existentes. Los nombres podrán revisarse más adelante,
pero no conviene rediseñar ni renombrar durante la primera migración.

### Imágenes compartidas actuales

- favicon SVG y PNG de Unátomo;
- logotipo redondo de Laundry Services;
- logotipos generales de Unátomo;
- `static/img/winged-shoe.png`.

Los recursos generales de Unátomo no deben sobrevivir en la versión pública
final de OpsLaundry. Se incluyen en el inventario porque hoy son dependencias
reales y habrá que sustituirlos por identidad OpsLaundry antes de publicar.

## Acoplamientos de identidad y dominio

Se han localizado 51 archivos entre frontend y funciones que contienen alguna
referencia a `unatomo`, `UNATOMO` o `unatomo.com`. Los cambios no pueden limitarse
a buscar y reemplazar el dominio. Afectan a:

- canonical, `hreflang`, Open Graph y JSON-LD;
- nombres del sitio y del proveedor legal;
- enlaces de cabecera y pie;
- logotipos, favicon y textos alternativos;
- correo público `info@opslaundry.com` y correo operativo heredado de Resend;
- remitente verificado `Unatomo <cuenta@correo.unatomo.com>`;
- enlaces incluidos en emails de Firebase Functions;
- enlaces a formularios de contacto del sitio general de Unátomo;
- títulos y textos legales.

La entidad legal no debe cambiarse automáticamente: que la marca pública sea
OpsLaundry no implica por sí solo que deje de operar `UNATOMO CORE SL`. Ese dato
requiere confirmación del propietario al adaptar privacidad y comunicaciones.

## Firebase y superficies operativas

Laundry Services utiliza actualmente el proyecto Firebase de Unátomo
`unatomo-c20a4` y las siguientes superficies:

- colección pública/administrada `laundry_public_catalog`;
- colección de maquinaria `agregador_maquinaria_LS`;
- colección privada `laundry_machine_submissions`;
- objetos privados `laundry-submissions/{submissionId}/...`;
- documentos de limitación de solicitudes de recambios;
- custom claim `laundryServicesAdmin`;
- App Check opcional mediante `ENFORCE_APP_CHECK`;
- secreto `RESEND_API_KEY`.

### Funciones propias de Laundry Services

- `submitLaundrySpareRequest`
- `submitLaundryMachine`
- `listLaundryMachineSubmissions`
- `notifyLaundryMachineSubmission`
- `getLaundryMachineSubmissionImage`
- `reviewLaundryMachineSubmission`

El código está dividido en 11 módulos bajo `firebase/functions/src/laundry/`.
Depende además de:

- `firebase/functions/src/core/firebase.ts`;
- `firebase/functions/src/email/resend.ts`;
- la frontera de exports de `firebase/functions/src/index.ts`;
- configuración TypeScript, ESLint y paquete de Functions;
- reglas e índices de Firestore y reglas de Storage;
- pruebas de solicitudes de recambios, propuestas de maquinaria y reglas.

### Decisión de aislamiento pendiente

Para una separación técnica total, OpsLaundry debería acabar con configuración
Firebase propia, reglas propias, funciones propias, credenciales App Check,
custom claims y secreto de correo propios. Reutilizar temporalmente
`unatomo-c20a4` permitiría una transición por fases, pero mantendría acoplamiento
operativo aunque la web ya estuviera en otro dominio.

No se moverán datos ni se desplegarán reglas o funciones durante la extracción
inicial. Primero se preparará y verificará el proyecto estático.

## Build, validación y publicación a conservar

La cadena existente usa:

- Node `22.12.0` y npm `11.0.0` para el proyecto raíz;
- Vite `^7.3.1`;
- PostCSS `8.5.26`;
- Firebase web/CLI `^12.17.1` y `^15.30.0`;
- Firebase Functions con Node 24 y TypeScript `^5.7.3`.

No se propone ninguna dependencia adicional.

Los scripts que deben extraerse y reducirse al ámbito de OpsLaundry son:

- `generate-config.mjs`;
- `dev-server.mjs`;
- `build-static.mjs`;
- `css-bundles.mjs`;
- `generate-laundry-machinery-pages.mjs`;
- `check-laundry-architecture.mjs`;
- `check-laundry-locales.mjs`;
- `sync-laundry-catalog.mjs`;
- `test-css-bundles.mjs`;
- `lint-links.mjs`;
- `scan-secrets.mjs`;
- `doctor.mjs`;
- `site-publish.mjs`.

El comportamiento de `site:publish` debe mantenerse: build, estadísticas,
stage, commit y push a `origin/main`. La build de OpsLaundry deberá copiar solo
sus archivos públicos, generar las páginas estáticas de detalle de maquinaria,
empaquetar CSS y excluir el archivo histórico de imágenes.

El script de estadísticas deberá conservarse porque `site:publish` ejecuta
actualmente `build:with-stats`.

## Archivos raíz y SEO que necesita el proyecto nuevo

- `package.json` y `package-lock.json`, reducidos sin cambiar versiones;
- `.nvmrc` y configuración Volta existente;
- `.gitignore`;
- `.env.example`, sin copiar `.env.local`;
- `.firebaserc.example`, sin asumir todavía el proyecto de producción;
- `.nojekyll`;
- `CNAME` con `OpsLaundry.com` cuando llegue la preparación de publicación;
- `index.html` raíz;
- `404.html` con soporte para detalles dinámicos de maquinaria;
- `robots.txt` y `sitemap.xml` exclusivos de OpsLaundry;
- `vite.config.mjs` reducido a sus rutas;
- `firebase.json` solo si se incluye el backend en este repositorio.

No se copiarán secretos, `.env.local`, logs, backups, `node_modules`, `dist` ni
salidas compiladas de Functions.

## Documentación mínima equivalente

Para mantener la misma forma de trabajo, el repositorio nuevo debería arrancar
con:

- `AGENTS.md` adaptado a OpsLaundry;
- `README.md`;
- `docs/REPO_MAP.md`;
- `docs/PROJECT_OVERVIEW.md`;
- `docs/OPSLAUNDRY_ARCHITECTURE.md`, derivado del documento actual de Laundry
  Services;
- `docs/CSS_ARCHITECTURE.md` limitado al producto;
- `docs/FIREBASE_MODEL.md` limitado a catálogo, maquinaria y solicitudes;
- `docs/DEV.md`;
- `docs/DEPLOY_NOTES.md`.

## Elementos que no pertenecen a OpsLaundry

No deben migrarse las páginas, componentes, datos ni funciones de:

- NFC, dashboard, máquinas de Unátomo y control panel general;
- Studio;
- Sense;
- Atom;
- landing corporativa de Unátomo;
- simulador de lavandería autoservicio, salvo decisión posterior explícita;
- backups NFC, estadísticas NFC y sus scripts;
- funciones de cuentas, etiquetas, accesos, documentos, tareas o notificaciones
  del dashboard.

## Orden de ejecución recomendado

1. Conectar el directorio vacío con el repositorio remoto OpsLaundry e importar
   la estructura mínima de proyecto.
2. Copiar el frontend de Laundry Services y su árbol real de dependencias
   compartidas sin cambiar todavía comportamiento ni diseño.
3. Mover las rutas desde `/laundryservices/...` a la raíz del dominio y adaptar
   los validadores a esa topología.
4. Sustituir identidad, canonical, `hreflang`, JSON-LD, Open Graph, enlaces,
   contacto y recursos de Unátomo.
5. Crear las cuatro páginas de contacto usando el patrón ya existente en
   Unátomo, sin añadir librerías.
6. Reducir build, pruebas y `site:publish` al nuevo alcance.
7. Verificar build estática, enlaces, localización, catálogo y páginas de detalle.
8. Resolver y ejecutar la separación Firebase de forma controlada.
9. Configurar GitHub Pages y verificar `OpsLaundry.com`.
10. Solo después, retirar Laundry Services de Unátomo en una tarea separada.

## Primer lote de implementación propuesto

El primer lote debe limitarse a estructura y fidelidad:

- inicialización Git/remoto;
- documentación base;
- copia selectiva de frontend y dependencias;
- scripts de build y validación reducidos;
- rutas adaptadas al dominio raíz;
- cero publicación y cero cambios en Firebase.

Este lote debe terminar con `npm run build` y `npm run test:laundry` funcionando
localmente antes de abordar identidad final, datos o despliegue.
