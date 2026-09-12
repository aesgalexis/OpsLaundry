# Estilos del sitio

`site/styles/site.css` es la entrada común. Sus 14 importaciones fijan el orden
de cascada: tokens, componentes, base, secciones, navegación, pie, maquinaria,
contacto, responsive y editorial. El build expande los imports y publica un
único `styles/site.css` minificado sin cambiar las URLs de recursos.

Los CSS propios del editor, catálogo, recambios y propuestas se mantienen junto
a sus módulos bajo `site/features/`. `npm run check:css` verifica el empaquetado,
el orden y la compatibilidad con el resultado minificado establecido.

Algunas clases e identificadores del DOM conservan prefijos `ls-` y `ut-`.
Siguen siendo contratos entre los 40 HTML, JavaScript y CSS; cambiarlos exige
una sustitución coordinada y una comprobación visual posterior. Ya no designan
carpetas ni archivos nuevos del proyecto.

El formulario de contacto requiere `.form-grid`, los `label[for]` emparejados,
`.form-consent-label > input + span`, `.ut-form-status` y `.ut-form-actions`.
Estas estructuras controlan la posición de campos, consentimiento y acciones.
