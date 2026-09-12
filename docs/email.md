# Correos y formularios de OpsLaundry

Las plantillas transaccionales y el envío de recambios y propuestas de
maquinaria pertenecen a **este repositorio y a las Functions de OpsLaundry**:

| Archivo | Contenido |
| --- | --- |
| `firebase/functions/src/email/branding.ts` | Cabecera HTML con el logo circular de Unátomo y el wordmark de OpsLaundry; remitente y destino vigentes. |
| `firebase/functions/src/email/delivery.ts` | Entrega mediante Resend, respuesta y errores. |
| `firebase/functions/src/spare-parts/spareRequestEmails.ts` | Aviso interno y confirmación de recambios en cuatro idiomas. |
| `firebase/functions/src/spare-parts/spareRequestWorkflow.ts` | Destinatarios y secuencia de envío de recambios. |
| `firebase/functions/src/machinery/machineSubmissions.ts` | Aviso interno y confirmación de nuevas propuestas de maquinaria. |

La entidad responsable confirmada es **UNATOMO CORE SL**. Temporalmente, el
remitente verificado es `Unatomo <cuenta@correo.unatomo.com>` y los avisos
internos siguen llegando a `info@unatomo.com`. Esta decisión incluye recambios
y nuevas propuestas de maquinaria. El contacto público y legal es
`info@opslaundry.com`; como es un buzón de reenvío, no se usa actualmente como
remitente Resend. Las confirmaciones se envían a la dirección facilitada por
quien presenta la solicitud.

El logo circular se carga desde `unatomo.com`; el wordmark de texto se sirve
desde `/static/img/opslaundry-wordmark-email.png` en OpsLaundry. Mantener esta
última URL evita romper correos ya enviados. Cambiar remitente o destinos
requiere revisar el servicio de correo y probar entregas reales.

El **formulario general de contacto** es independiente de estas Functions:
usa Formspree mediante `site/features/contact/` y conserva su destino actual.
El asunto oculto identifica los mensajes como `opslaundry`; el endpoint y su
destino operativo se mantienen sin cambios.
