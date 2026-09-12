# Desarrollo local

Utiliza las versiones Node y npm declaradas en `.nvmrc` y `package.json`.

```powershell
npm.cmd install
npm.cmd run doctor
npm.cmd run dev
```

Vite sirve `site/` como raíz. `npm run dev:static` ofrece una alternativa
estática. La configuración Firebase de desarrollo está en `.env.local`, que se
genera a partir de `.env.example` con los valores del proyecto OpsLaundry y no
se versiona. `predev` y `prebuild` crean el archivo público de configuración
de ejecución bajo `site/static/js/config/`.

Antes de entregar cambios del sitio:

```powershell
npm.cmd test
npm.cmd run build
```

`npm run catalog:check` valida el catálogo versionado sin escribir en Firebase.
`npm run catalog:sync` escribe en el proyecto configurado; es una operación
administrativa distinta de la comprobación local.

La verificación comienza por código, tests y resultado del build. Las reglas
de acceso visual y publicación están en `AGENTS.md`.
