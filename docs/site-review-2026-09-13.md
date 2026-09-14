# Revisión estructural y operativa — 13 de septiembre de 2026

Las mejoras de esta revisión están **locales, sin publicar**. No se ha
desplegado Firebase ni activado App Check. No se han modificado HTML, CSS,
imágenes ni textos visibles del sitio, ni añadido dependencias.

## Lista única y estado

1. **Correcciones del lint: publicadas.** Commit `9091269`; ejecución
   [34779261700](https://github.com/aesgalexis/OpsLaundry/actions/runs/34779261700)
   terminada correctamente. Este era el despliegue pendiente anterior.
2. **Despliegue y recuperación: verificados.** Actions guardó
   `public-machinery-v1-34779261700-1`, 8.735 bytes, el 13/09 a las 19:58 UTC.
   El build de ese despliegue obtuvo 37 anuncios y generó 148 fichas.
3. **SEO publicado: muestra correcta.** A las 20:33 UTC se comprobaron las
   cuatro portadas y la ficha C001 en los cuatro idiomas. HTTP, idioma, H1,
   título, descripción, canonical, hreflang y JSON-LD correctos. Sitemap:
   192 URLs, coincidentes con las 44 páginas y las 148 fichas actuales.
   Robots declara sitemap; catálogo y solicitudes conservan `noindex`.
4. **Search Console: bloqueado por acceso.** La sesión disponible dirige a
   la página pública con «Start now». Falta acceder a la propiedad para
   comprobar indexación, canónicas elegidas por Google y avisos. El chequeo
   del HTML no acredita indexación real.
5. **Rendimiento móvil: medido.** [Informe de la portada española](https://pagespeed.web.dev/analysis/https-opslaundry-com-es/z864j48b99?form_factor=mobile),
   22:30 Madrid, Lighthouse 13.4.1, Moto G Power emulado y 4G lento:
   rendimiento 100, FCP 0,9 s, LCP 1,3 s, TBT 0 ms, CLS 0,049,
   Speed Index 2,4 s. Accesibilidad, buenas prácticas y SEO automáticos: 100.
   No hay datos de campo: INP real y otras páginas no quedan acreditados.
   La API devolvió 429; se obtuvo una única medición mediante su interfaz.
6. **Cambios reales de maquinaria: sin caso nuevo disponible.** No hay
   diferencias con la copia local anterior ni retiradas. C001 coincide con
   Firestore en metadatos y precio. Las pruebas locales cubren precio,
   retirada y reactivación; falta observar el siguiente cambio real del dueño.
   No se han alterado anuncios ni enviado formularios para probar.
7. **Regeneración sin push: solución definida.** `workflow_dispatch` ya
   permite reconstruir/publicar el código de `main` con datos actuales desde
   Actions, sin commit. No se ha ejecutado ahora. El disparo desde el editor
   requiere el puente autenticado descrito más abajo y una decisión del dueño.
8. **Formularios: mejoras locales implementadas.** Bloqueo lógico de envíos
   concurrentes en contacto, recambios y propuestas. Recambios conserva el ID
   al reintentar el mismo contenido y lo renueva si cambia; captura los campos
   antes de preparar las imágenes. Rechazos explícitos no muestran éxito.
   Los adjuntos se validan antes de leerlos y se comprimen de uno en uno para
   limitar memoria. Se conserva el aviso de confirmación fallida. Entrega de
   correo limita la espera a 15 segundos y mantiene claves de idempotencia.
   Contacto continúa con Formspree y reintento manual: no se promete deduplicación
   del proveedor ni entrega final. Recambios sigue dependiendo de la idempotencia
   del proveedor; no tiene una cola duradera propia como las propuestas.
9. **Firebase/App Check: revisión y preparación local, activación pendiente.**
   El build admite `FIREBASE_BUILD_ACCESS_TOKEN` efímero por cabecera OAuth,
   separado de la configuración pública. El chequeo del artefacto bloquea
   tokens debug/App Check o de build en runtime config. No se han configurado
   IAM, credenciales nuevas ni enforcement. La separación de datos públicos
   descrita abajo sigue siendo necesaria.
10. **Rutas compartidas: centralizadas.** `site/shared/routes.mjs` alimenta
    navegación generada, enlaces de Nosotros, rutas/metadatos de maquinaria y
    comprobación de idiomas. Se mantienen las URLs y el HTML estático. El
    contenido editorial sigue en sus páginas; no se ha convertido en una SPA.
11. **Trabajo en segundo plano: reducido.** Las suscripciones públicas a
    maquinaria se cierran al ocultar/salir de la página y se restablecen al
    volver, incluida restauración de navegación. El clima cancela solicitudes
    y temporizadores en segundo plano. Preparación de imágenes secuencial.
    No se altera CSS ni se recomprimen imágenes visibles para perseguir una
    puntuación ya de 100. PageSpeed señala oportunidades de caché, imágenes y
    animaciones que podrán valorarse por página si aparecen problemas reales.
12. **Seguimiento operativo: base local implementada.** `npm run check:production`
    comprueba la muestra y coherencia del sitemap/inventario; guarda solo el
    resultado público en `.cache/production-check.json` y falla con código 1
    ante incidencias. Los correos emiten eventos estructurados sin destinatarios,
    contenido ni respuestas completas del proveedor. Una muestra de 30 logs
    existentes contiene 11 NOTICE, 18 INFO y 1 DEBUG, sin WARNING/ERROR; corresponde
    al 11–12 de septiembre, por lo que no prueba entregas recientes. No se han
    creado alertas, suscripciones ni automatizaciones nuevas.

## Separación de datos públicos y permisos

La revisión de las reglas **versionadas** muestra lectura pública completa de
`agregador_maquinaria_LS`. Filtrar `visible` en el navegador no es un permiso:
un cliente puede consultar directamente documentos ocultos y campos como
`createdBy`, que el editor rellena con el correo del administrador.
La copia estática usa una lista explícita de campos permitidos, pero eso no
limita la API Firestore. Esta revisión no certifica que las reglas desplegadas
sean idénticas a las locales.

La migración propuesta conserva la colección administrativa y crea una
proyección pública con los campos de `publicMachines`. Un proceso de backend
publica solo anuncios visibles, elimina la proyección al retirarlos y permite
reconstruirla. Después se cambian lector público y build, se verifican las
cuatro traducciones y se restringe la colección original a administradores.
Las imágenes públicas y sus URLs requieren una política de retirada propia;
ocultar el anuncio no revoca por sí solo el acceso al objeto.

El orden evita romper las lecturas actuales. El dueño debe acordar la
migración y su despliegue antes de cerrar la colección original. No basta con
retirar `createdBy` del mapeo JavaScript ni con activar App Check.

App Check del navegador ya usa reCAPTCHA Enterprise. Para el build se propone
identidad de servicio con permisos mínimos de lectura e identidad federada de
GitHub, obteniendo un token OAuth temporal; nunca clave JSON duradera o token
debug público. Se ha preparado su transporte, no la infraestructura ni su
validación contra enforcement. Hay que verificar ese camino en un entorno
controlado y observar tráfico legítimo antes de activar protección.
[Autenticación REST oficial](https://firebase.google.com/docs/firestore/use-rest-api)
y [App Check](https://firebase.google.com/docs/app-check).

## Actualización de fichas desde administración

La opción inmediata es ejecutar manualmente **Deploy Pages → Run workflow**
sobre `main`, usando el flujo existente. Publica el código ya guardado en GitHub;
no incorpora estas mejoras locales. Revisar el resultado y repetir
`npm run check:production` permite detectar un sitemap o ficha desactualizados.

Para actualizar desde el editor sin compartir credenciales de GitHub con el
navegador: callable administrativa que compruebe `laundryServicesAdmin` y
App Check, agrupe cambios cercanos, registre una revisión pendiente y dispare
el workflow con una credencial de GitHub almacenada en servidor y permisos
mínimos. El editor debe distinguir cambio guardado de HTML publicado; un fallo
de publicación no debe deshacer el anuncio. Las retiradas deben solicitar un
build fresco, sin aceptar una copia anterior como actualización exitosa.
Reintentos y confirmación del run requieren un registro duradero del estado.

Quedan por acordar: activación manual o automática al guardar, identidad/secret
de GitHub y despliegue del puente. Es reversible deshabilitando el disparo y
volviendo al workflow manual; no requiere cambiar la arquitectura estática.

## Operación y criterios de intervención

- Tras publicar o cambiar un anuncio: `npm run check:production`. La muestra
  elige un anuncio cambiado si existe una copia anterior válida; no pretende
  inspeccionar el contenido de las 148 fichas en cada ejecución. El build sí
  revisa la integridad del artefacto completo.
- Para detectar errores de correo en Cloud Logging, filtrar por
  `jsonPayload.event="email_transport_failed"` o
  `jsonPayload.event="email_provider_rejected"`. Separar
  `email_provider_accepted` de entrega final: aceptación de Resend no acredita
  llegada a la bandeja. Los campos nuevos solo existirán tras desplegar Functions.
- Revisar también «Laundry spare request accepted without confirmation email»
  y propuestas sin `notificationSentAt`. No enviar una segunda propuesta si
  ya hay referencia aceptada; revisar el estado de su notificación.
- Una alerta automática necesita umbral, ventana y destinatario acordados.
  Se propone avisar por errores repetidos de correo y por discrepancias tras
  una actualización, no por ausencia de solicitudes cuando no haya tráfico.

## Validación local

`npm test` correcto: CSS, límites de arquitectura, 44 páginas/idiomas, 22
pruebas de frontend, Functions, enlaces y escaneo de secretos. Incluye pruebas
de concurrencia y reintento de contacto, validación de adjuntos, suspensión y
restauración de suscripciones y cabeceras del build paginado.
`npm run build` correcto: 37 máquinas, 148 fichas y 192 URLs. La comparación de
la cabecera/pie estáticos y reglas CSS se mantiene correcta. No hay cambios de
HTML/CSS/activos fuente. No se han hecho envíos reales ni publicado esta revisión.
