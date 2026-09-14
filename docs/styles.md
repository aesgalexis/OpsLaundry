# Estilos del sitio

`site/styles/site.css` es la entrada común. Sus 14 importaciones fijan el orden
de cascada: tokens, componentes, base, secciones, navegación, pie, maquinaria,
contacto, responsive y editorial. El build expande los imports y publica un
único `styles/site.css` minificado sin cambiar las URLs de recursos.

Las páginas localizadas que no usan los controles de maquinaria cargan
`styles/site-public.css`: conserva las mismas importaciones y orden, excepto
`machinery.css`. Maquinaria, sus fichas, Recambios (que comparte `filter-select`)
y propuestas de maquinaria, y las entradas administrativas conservan el manifiesto completo. No se han
cambiado selectores, declaraciones ni puntos de ruptura para esta separación.
Las pruebas comparan las reglas comunes y detectan si una página que carga el
CSS reducido introduce clases que necesitan el archivo de maquinaria.

Los CSS propios del editor, catálogo, recambios y propuestas se mantienen junto
a sus módulos bajo `site/features/`. `npm run check:css` verifica el empaquetado,
el orden y la compatibilidad con el resultado minificado establecido.

Recambios y la propuesta de venta de maquinaria comparten directamente
`features/spare-parts/request.css`: ancho de 1040px, progreso fuera de la tarjeta,
campos, carga de imágenes, resumen y navegación. El progreso admite
`--form-step-count` (cuatro por defecto, tres en propuestas). No duplicar estos
estilos en propuestas; su CSS contiene solo ajustes propios y la revisión privada.

Las clases, identificadores del DOM y variables CSS usan nombres descriptivos
en inglés, sin prefijos de Laundry Services ni Unátomo. Los cambios de nombre
se aplican conjuntamente a HTML, CSS, JavaScript y generadores de páginas.

El formulario de contacto requiere `.form-grid`, los `label[for]` emparejados,
`.form-consent-label > input + span`, `.form-status` y `.form-actions`.
Estas estructuras controlan la posición de campos, consentimiento y acciones.

Nosotros y las cuatro páginas de servicios explicativos comparten
`.editorial-story`, `.editorial-intro` y `.editorial-section` en `editorial.css`:
título a la izquierda y texto a la derecha, una columna por debajo de 640px.
El H1 se mantiene entre 1.5 y 2rem. Inicio conserva las tarjetas de servicios.
