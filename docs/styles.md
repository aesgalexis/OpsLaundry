# Estilos del sitio

`site/styles/site.css` es la entrada común. Sus 14 importaciones fijan el orden
de cascada: tokens, componentes, base, secciones, navegación, pie, maquinaria,
contacto, responsive y editorial. El build expande los imports y publica un
único `styles/site.css` minificado sin cambiar las URLs de recursos.

Los CSS propios del editor, catálogo, recambios y propuestas se mantienen junto
a sus módulos bajo `site/features/`. `npm run check:css` verifica el empaquetado,
el orden y la compatibilidad con el resultado minificado establecido.

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
