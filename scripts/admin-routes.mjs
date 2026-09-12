// Compatibility URLs for existing bookmarks and notification emails.
export const adminRouteAliases = new Map([
  ["catalogo", "catalog"],
  ["solicitudes", "requests"],
]);

export const cleanDirectoryRoutes = new Map([["/", "/index.html"]]);
for (const [legacy, current] of adminRouteAliases) {
  for (const route of [legacy, current]) {
    for (const suffix of ["", "/", "/index.html"]) {
      cleanDirectoryRoutes.set(`/${route}${suffix}`, `/${current}/index.html`);
    }
  }
}
