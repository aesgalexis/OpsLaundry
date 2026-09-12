# Arquitectura de OpsLaundry

OpsLaundry es un sitio estático localizado. El HTML físico contiene el texto
editorial en español, inglés, italiano y griego. JavaScript gestiona navegación,
formularios, listados y datos operativos; no monta páginas traducidas completas.

## Rutas y código

El build copia `site/` a `dist/`, empaqueta `styles/site.css` y genera snapshots
de maquinaria. Las páginas públicas usan `/{idioma}/{ruta-traducida}/`; la raíz
redirige a `/es/`. Las rutas `/catalogo/` y `/solicitudes/` son administrativas
y llevan `noindex`.

Los módulos reutilizables están en `site/shared/`. Cada función del producto
tiene su código en `site/features/`. Las páginas HTML pueden permanecer en la
ruta que reciben los visitantes sin dispersar el JavaScript por idioma.

## Maquinaria de ocasión

El listado y las fichas solo muestran máquinas ofrecidas en la sección pública
de maquinaria de ocasión. `features/machinery/list.js` importa estáticamente el
repositorio de lectura pública. El acceso administrativo, Storage y el editor
se cargan después de comprobar la sesión y el claim `laundryServicesAdmin`.
Ese claim es un identificador ya desplegado; cambiarlo requiere migración de
permisos, no un simple cambio de nombre de archivo.

Firestore es la fuente de verdad. El build puede prerenderizar las primeras 20
máquinas visibles del listado y las fichas localizadas. La falta de acceso a
Firestore no debe bloquear el build. Los snapshots solo se escriben en `dist/`.
No se incrusta el catálogo operativo en JavaScript o JSON público.

## Formularios y backend

Recambios y propuestas usan Functions propias del proyecto OpsLaundry. El
catálogo público de recambios lee Firestore; las propuestas y sus imágenes
privadas no quedan expuestas al navegador. El formulario general usa la
integración Formspree existente. Sus destinos actuales se mantienen por
decisión del propietario; consulta `email.md`.

`firebase/functions/src/index.ts` conserva los nombres de las seis Functions
desplegadas. Los módulos fuente se agrupan por responsabilidad, pero los nombres
de Functions, colecciones, claims y rutas de Storage son contratos externos y
no se renombran al ordenar carpetas.

## Comprobaciones

`npm run test:site` verifica límites del frontend, las 40 páginas localizadas y
sus metadatos. `npm test` añade CSS, Functions, enlaces y secretos. `npm run
build` comprueba el artefacto; los límites de tamaño del frontend están en
`scripts/check-architecture.mjs`.
