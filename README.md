# OpsLaundry

Sitio y herramientas operativas para servicios de lavandería industrial,
maquinaria de ocasión y solicitudes de recambios.

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

La arquitectura y el estado de la extracción están documentados en `docs/`.
