import {routePath} from "../site/shared/routes.mjs";
export const footerNavigation = {
  es: {
    home: routePath("es", "home"),
    title: "Servicios",
    items: [
      ["Auditoría técnica", routePath("es", "audit")],
      ["Contadores y automatización", routePath("es", "automation")],
      ["Inversiones y proyectos", routePath("es", "investments")],
      ["Maquinaria y equipamiento", routePath("es", "machinery")],
      ["Recambios y componentes", routePath("es", "spares")],
      ["Asistencia técnica", routePath("es", "support")]
    ]
  },
  en: {
    home: routePath("en", "home"),
    title: "Services",
    items: [
      ["Technical audit", routePath("en", "audit")],
      ["Counters and automation", routePath("en", "automation")],
      ["Investments and projects", routePath("en", "investments")],
      ["Machinery and equipment", routePath("en", "machinery")],
      ["Spare parts and components", routePath("en", "spares")],
      ["Technical support", routePath("en", "support")]
    ]
  },
  it: {
    home: routePath("it", "home"),
    title: "Servizi",
    items: [
      ["Audit tecnico", routePath("it", "audit")],
      ["Contatori e automazione", routePath("it", "automation")],
      ["Investimenti e progetti", routePath("it", "investments")],
      ["Macchinari e attrezzature", routePath("it", "machinery")],
      ["Ricambi e componenti", routePath("it", "spares")],
      ["Assistenza tecnica", routePath("it", "support")]
    ]
  },
  el: {
    home: routePath("el", "home"),
    title: "Υπηρεσίες",
    items: [
      ["Τεχνικός έλεγχος", routePath("el", "audit")],
      ["Μετρητές και αυτοματισμοί", routePath("el", "automation")],
      ["Επενδύσεις και έργα", routePath("el", "investments")],
      ["Μηχανήματα και εξοπλισμός", routePath("el", "machinery")],
      ["Ανταλλακτικά και εξαρτήματα", routePath("el", "spares")],
      ["Τεχνική υποστήριξη", routePath("el", "support")]
    ]
  }
};
