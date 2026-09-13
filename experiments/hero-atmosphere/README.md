# Hero: luz y atmósfera

Laboratorio independiente de la portada pública. Abrir `index.html` directamente
en un navegador permite comparar las variantes sin servidor ni dependencias nuevas.
No entra en el artefacto publicado porque está fuera de `site/`.

## Primera propuesta

- Cuatro luces: amanecer, día, atardecer y noche.
- Cinco condiciones independientes: despejado, nublado, lluvia, tormenta y niebla.
- Referencia al hero actual con sus estilos originales.
- Textos extraídos de las portadas española, inglesa, italiana y griega en `copy.js`.
- Hora automática del dispositivo, actualizada cada minuto y al volver a la pestaña.
- Capas decorativas ocultas a lectores de pantalla, controles etiquetados y movimiento reducido.
- Velo sobre el fondo para proteger la lectura; noche con texto y botón claros.

El prototipo usa franjas horarias fijas (6–8, 8–18, 18–21 y noche).
No son horas astronómicas: sirven para explorar la dirección visual. Los controles
y los nombres de estado pertenecen al laboratorio, no a la futura portada.
No consulta APIs, no solicita GPS ni almacena ubicaciones. No hay temperatura,
ciudad, predicción ni flashes. La lluvia es una textura preliminar de CSS.

## Integración prevista

1. Revisar visualmente estas variantes con el propietario, incluyendo móvil,
   contraste de todos los estados y preferencia de movimiento reducido.
2. Preparar un controlador compartido bajo `site/features/hero-atmosphere/` y
   conectarlo a las cuatro portadas. Mantener el HTML actual como respaldo inmediato.
3. Elegir un proveedor de ubicación aproximada y meteorología, comprobando coste,
   licencias, atribución, privacidad y límites antes de añadir consultas externas.
4. Normalizar la respuesta a `{ light, weather }`. Amanecer y puesta reales deben
   usar timestamps del lugar aproximado; la noche puede coexistir con lluvia o niebla.
5. Consultar después del primer render, con timeout y caché de 45 minutos.
   Validar el esquema y caducidad; tolerar almacenamiento bloqueado. No guardar IP
   ni coordenadas precisas. No mostrar datos meteorológicos al visitante.
6. Aplicar un cambio suave entre capas cuando lleguen datos; sin movimiento si el
   dispositivo lo solicita. Cancelar consultas y temporizadores al desmontar.
7. Ante fallo o datos inválidos, conservar/restaurar el hero original. El modo de
   luz por reloj es una alternativa explícita que debe decidirse al integrar.

## Verificación

`node --test experiments/hero-atmosphere/atmosphere.test.cjs`

Prueba límites horarios, entradas inválidas y las 20 combinaciones independientes.
La implementación se ha revisado por código; queda pendiente validación visual.
La exploración no modifica rutas, estilos compartidos, configuración ni publicación.
