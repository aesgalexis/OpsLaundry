# Hero conectado

Las cuatro portadas cargan `site/features/hero-atmosphere/`. El HTML original
se mantiene disponible si JavaScript no arranca. No hay nuevas dependencias.

## Luz

Usa exclusivamente la hora del dispositivo (`Date.getHours()`): amanecer 06–08,
día 08–18, atardecer 18–21 y noche 21–06. Son bandas visuales aproximadas, no
horas solares. Se revisa cada minuto y al volver a la pestaña.

## Meteorología y ubicación

Una consulta directa desde el navegador a `https://wttr.in/?format=j2` obtiene
condiciones actuales para la ubicación aproximada por IP. Al no indicar ciudad,
wttr.in resuelve la IP de quien consulta. No se utiliza `navigator.geolocation`,
GPS, permisos de ubicación, claves ni un proxy que localizaría al servidor.

El proveedor recibe la IP como parte de la conexión HTTPS. La consulta omite
credenciales y referrer. OpsLaundry no guarda la respuesta completa, IP ni
coordenadas. Guarda el estado visual, la localidad aproximada, la temperatura
redondeada y su vencimiento en `localStorage` (`opslaundry.hero-weather.v2`),
durante 45 minutos de validez. Si
el almacenamiento está bloqueado, la caché sigue funcionando en memoria.

El formato j2 evita el detalle horario. Se validan el área y el código WWO. Los
códigos se reducen a despejado, nublado, lluvia, tormenta y niebla. Nieve se
representa con nubes; la luz siempre sigue el reloj local, también con VPN.

La consulta empieza después del render inicial, tiene un timeout de 6,5 segundos
y se comparte si hay llamadas simultáneas. La pestaña oculta no inicia consultas.
Los fallos dejan el cielo controlado por la hora local, sin presentar ese estado
como tiempo real; se reintenta después de 15 minutos. Al salir se aborta la petición.

El sistema funciona siempre en automático, sin puntos de prueba, botón de modo
ni enlace visible al proveedor. Una firma pequeña en la esquina inferior derecha
muestra «Cerca de [localidad] · [temperatura] °C», traducida a los cuatro idiomas.
Solo se muestra con datos válidos; se oculta cuando falla la consulta. Usa la misma
respuesta y caché, sin consultas adicionales. La fuente se documenta aquí.

## Verificación y fuentes

- `node --test scripts/test-hero-weather.cjs`, incluido en `npm run test:site`.
- Comprobación HTTP real: endpoint j2 respondió 200, JSON y `Access-Control-Allow-Origin: *`.
- [Documentación wttr.in](https://github.com/chubin/wttr.in): geolocalización por IP y JSON j2.
- [Códigos WWO](https://www.worldweatheronline.com/weather-api/api/docs/weather-icons.aspx).

Servicio público sin SLA contratado: su disponibilidad y precisión no son un
requisito para cargar la portada. No se ha publicado ni desplegado este cambio.
