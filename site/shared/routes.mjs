// Shared route registry for static generation and browser modules.
export const ROUTES = {
  es: {about: "nosotros", submission: "enviar-maquina", home: "", audit: "auditoria", support: "asistencia-tecnica", investments: "inversiones", automation: "automatizacion", machinery: "maquinaria-ocasion", spares: "recambios", contact: "contacto", privacy: "privacidad"},
  en: {about: "about-us", submission: "submit-machine", home: "", audit: "technical-audit", support: "technical-support", investments: "investments", automation: "automation", machinery: "used-machinery", spares: "spare-parts", contact: "contact", privacy: "privacy"},
  it: {about: "chi-siamo", submission: "invia-macchina", home: "", audit: "audit-tecnico", support: "assistenza-tecnica", investments: "investimenti", automation: "automazione", machinery: "macchinari-usati", spares: "ricambi", contact: "contatto", privacy: "privacy"},
  el: {about: "poioi-eimaste", submission: "ypovoli-michanimatos", home: "", audit: "technikos-elegchos", support: "techniki-ypostirixi", investments: "ependyseis", automation: "aftomatismoi", machinery: "metacheirismena-michanimata", spares: "antallaktika", contact: "epikoinonia", privacy: "aporrito"},
};

export const routePath = (lang, page) => {
  const slug = ROUTES[lang]?.[page];
  if (slug === undefined) throw new Error(`Unknown route: ${lang}/${page}`);
  return `/${lang}/${slug ? `${slug}/` : ""}`;
};
