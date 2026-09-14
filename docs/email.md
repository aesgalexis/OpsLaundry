# Correos y formularios de OpsLaundry

Las plantillas transaccionales y el envío de recambios y propuestas de
maquinaria pertenecen a **este repositorio y a las Functions de OpsLaundry**:

| Archivo | Contenido |
| --- | --- |
| `firebase/functions/src/email/branding.ts` | Cabecera HTML con el wordmark de OpsLaundry; remitente y destino de la cuenta propia. |
| `firebase/functions/src/email/delivery.ts` | Entrega mediante Resend, respuesta y errores. |
| `firebase/functions/src/email/transactional.ts` | Marco de 600px adaptado del proyecto vecino Unátomo, con cabecera, cuerpo y pie de OpsLaundry. |
| `firebase/functions/src/machinery/emails.ts` | Aviso de revisión estructurado y confirmación de propuesta en cuatro idiomas, sin rayas largas. |
| `firebase/functions/src/spare-parts/emails.ts` | Aviso interno y confirmación de recambios en cuatro idiomas. |
| `firebase/functions/src/spare-parts/workflow.ts` | Destinatarios y secuencia de envío de recambios. |
| `firebase/functions/src/machinery/submissions.ts` | Disparo y entrega del aviso interno y confirmación de nuevas propuestas. |

La entidad responsable confirmada es **UNATOMO CORE SL**. El propietario ha
configurado `info@opslaundry.com` en Zoho y creado una cuenta propia de Resend.
El código desplegado usa `OpsLaundry <info@opslaundry.com>` como remitente y
`info@opslaundry.com` como destino de avisos internos de recambios y propuestas.
Las confirmaciones se envían al solicitante con Reply-To al buzón de Zoho;
los avisos internos llevan Reply-To a la dirección del solicitante.

Estado de la transición (14/09/2026): dominio `opslaundry.com` registrado en
Resend, región Irlanda, verificado; DKIM, ambos CNAME y DMARC publicados en
Squarespace. Clave `OpsLaundry Firebase transactional` creada con permiso
`Sending access` limitado a `opslaundry.com` y guardada en `RESEND_API_KEY`,
versión 2, del proyecto `opslaundry-2907b`. La copia temporal fue eliminada.
Desplegadas correctamente `notifyLaundryMachineSubmission` (europe-west1) y
`submitLaundrySpareRequest` (us-central1) con el nuevo código y secreto.
Prueba real enviada a `info@opslaundry.com` a las 10:44 UTC del 14/09/2026:
Resend muestra `delivered`, ID `999f6898-3dad-4253-91b9-4b4e992a1ee3`.
La prueba usa la clave versión 2 y la plantilla compartida, sin crear una
solicitud ficticia en producción. Confirma entrega al servidor receptor;
no se ha inspeccionado la carpeta de entrada de Zoho ni realizado una respuesta.
Los cambios locales superan `npm --prefix firebase/functions test`.
La revisión final de diseño conserva el PNG de 760 × 180 píxeles y lo presenta
a 228 × 54, sin deformar su proporción. Todos los títulos principales de correo
usan 20 px, peso 600 e interlineado 1.35. La prueba final del 14/09/2026 a las
10:52 UTC figura como `delivered` en Resend, ID
`79939ab7-43f0-47e9-b567-df1c3cadf197`, asunto
`OpsLaundry — prueba final de correo`. El propietario ha aprobado el diseño final. Para futuros correos de prueba,
el asunto usa guion normal: `OpsLaundry - prueba final de correo`.
La identidad anterior `Unatomo <cuenta@correo.unatomo.com>` y el destino
`info@unatomo.com` han sido sustituidos en estos dos flujos. La versión anterior
del secreto se conserva para permitir una reversión coordinada con el código.

La cabecera usa únicamente el wordmark servido desde
`/static/img/opslaundry-wordmark-email.png` en OpsLaundry. Se conserva esta URL
para no romper correos anteriores. Zoho mantiene los MX del dominio raíz y su
SPF. Resend tiene la recepción desactivada y solicita DKIM en
`resend._domainkey`, CNAME `rsend` hacia `rsend-euw1.forge.rmta.net` y CNAME
`send` hacia `send.forge.rmta.net`. Los registros se añadieron sin reemplazar
los de Zoho. El registro DMARC inicial es `v=DMARC1; p=none;` en `_dmarc`.

El **formulario general de contacto** es independiente de estas Functions:
usa Formspree mediante `site/features/contact/` y conserva su destino actual.
El asunto oculto identifica los mensajes como `opslaundry`; el endpoint y su
destino operativo se mantienen sin cambios.
