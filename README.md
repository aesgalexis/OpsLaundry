# OpsLaundry

Sitio independiente de servicios para lavandería industrial, maquinaria de
ocasión y solicitudes de recambios. Las páginas públicas están disponibles en
español, inglés, italiano y griego.

## Desarrollo local

```powershell
npm.cmd install
npm.cmd run dev
```

## Validación

```powershell
npm.cmd test
npm.cmd run build
```

Las Functions se validan como parte de `npm test`. Para instalarlas por separado:

```powershell
npm.cmd --prefix firebase/functions install
```

## Publicación

La publicación es una operación del propietario:

```powershell
npm.cmd run site:publish
```

El código publicable está en `site/`; las Functions y reglas propias están en
`firebase/`. Consulta `docs/repository-map.md` para orientarte,
`docs/architecture.md` para las responsabilidades del sitio y `docs/email.md`
para las plantillas y destinos de correo.
