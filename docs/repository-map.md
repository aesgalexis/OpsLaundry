# Mapa del repositorio

OpsLaundry usa HTML, CSS y JavaScript estáticos para el sitio público y Firebase
para catálogo, maquinaria de ocasión, propuestas y solicitudes de recambios.

| Ubicación | Responsabilidad |
| --- | --- |
| `site/` | Raíz del artefacto público. Su contenido se copia a `dist/` conservando las rutas. |
| `site/es/`, `site/en/`, `site/it/`, `site/el/` | Páginas HTML localizadas. |
| `site/catalog/`, `site/requests/` | Entradas privadas, sin indexación. |
| `site/features/machinery/` | Listado, fichas, editor y repositorios de maquinaria de ocasión ofrecida públicamente. |
| `site/features/spare-parts/` | Formulario de recambios. |
| `site/features/submissions/` | Propuesta pública de maquinaria y revisión privada. |
| `site/features/catalog/` | Catálogo de fabricantes/modelos y administración. |
| `site/features/contact/` | Formulario general y controlador Formspree. |
| `site/shared/` | Firebase, acceso administrativo, formularios y elementos comunes de navegación. |
| `site/styles/` | CSS compartido, tokens, componentes y manifiesto `site.css`. |
| `site/assets/`, `site/static/img/` | Imágenes publicadas; `static/img` conserva la URL del wordmark de correo. |
| `firebase/functions/src/` | Functions agrupadas en `core/`, `email/`, `machinery/` y `spare-parts/`. |
| `firebase/catalog/`, reglas e índices | Fuente versionada del catálogo y permisos de Firebase. |
| `scripts/` | Build, generación de configuración, snapshots y comprobaciones. |
| `brand/archive/` | Fuentes históricas de marca, fuera de `site/` y del artefacto público. |

La ruta del código fuente bajo `site/` no forma parte de la URL. Por ejemplo,
`site/es/maquinaria-ocasion/index.html` se publica en
`/es/maquinaria-ocasion/`. `npm run site:publish` sigue siendo el flujo de
publicación del propietario; los cambios locales no se publican solos.

## Documentación

- `editorial-guide.md`: voz, alcance de los textos públicos y registro de aprendizaje editorial; leer antes de redactar o corregir contenido explicativo.
- `architecture.md`: rutas, límites entre código público y administración.
- `styles.md`: entrada CSS, cascada y clases estructurales.
- `firebase.md`: datos, seguridad y contratos desplegados.
- `email.md`: plantillas, remitente y destinos.
- `development.md`: comandos locales y verificación.
- `deployment.md`: build y publicación.
- `migration-status.md`: datos trasladados y comprobaciones pendientes.
