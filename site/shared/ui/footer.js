(() => {
  const footerNavigation = {
    es: {
      home: "/es/",
      title: "Servicios",
      items: [
        ["Auditoría técnica", "/es/auditoria/"],
        ["Contadores y automatización", "/es/automatizacion/"],
        ["Inversiones y proyectos", "/es/inversiones/"],
        ["Maquinaria y equipamiento", "/es/maquinaria-ocasion/"],
        ["Recambios y componentes", "/es/recambios/"],
        ["Asistencia técnica", "/es/asistencia-tecnica/"]
      ]
    },
    en: {
      home: "/en/",
      title: "Services",
      items: [
        ["Technical audit", "/en/technical-audit/"],
        ["Counters and automation", "/en/automation/"],
        ["Investments and projects", "/en/investments/"],
        ["Machinery and equipment", "/en/used-machinery/"],
        ["Spare parts and components", "/en/spare-parts/"],
        ["Technical support", "/en/technical-support/"]
      ]
    },
    it: {
      home: "/it/",
      title: "Servizi",
      items: [
        ["Audit tecnico", "/it/audit-tecnico/"],
        ["Contatori e automazione", "/it/automazione/"],
        ["Investimenti e progetti", "/it/investimenti/"],
        ["Macchinari e attrezzature", "/it/macchinari-usati/"],
        ["Ricambi e componenti", "/it/ricambi/"],
        ["Assistenza tecnica", "/it/assistenza-tecnica/"]
      ]
    },
    el: {
      home: "/el/",
      title: "Υπηρεσίες",
      items: [
        ["Τεχνικός έλεγχος", "/el/technikos-elegchos/"],
        ["Μετρητές και αυτοματισμοί", "/el/aftomatismoi/"],
        ["Επενδύσεις και έργα", "/el/ependyseis/"],
        ["Μηχανήματα και εξοπλισμός", "/el/metacheirismena-michanimata/"],
        ["Ανταλλακτικά και εξαρτήματα", "/el/antallaktika/"],
        ["Τεχνική υποστήριξη", "/el/techniki-ypostirixi/"]
      ]
    }
  };

  const legalFooter = document.getElementById("legal-footer");
  const control = legalFooter?.querySelector(".footer-disclosure-control");
  const toggle = control?.querySelector(".footer-disclosure-toggle");
  const panel = control?.querySelector(".footer-disclosure-panel");
  if (!legalFooter || !control || !panel) return;

  const label = panel.getAttribute("aria-label");
  legalFooter.setAttribute("role", "contentinfo");
  if (label) legalFooter.setAttribute("aria-label", label);

  const lang = document.documentElement.lang.slice(0, 2);
  const navigation = footerNavigation[lang] || footerNavigation.es;
  const upperFooterMount = document.getElementById("upperfooter-mount");
  const upperFooter = upperFooterMount?.querySelector(".upperfooter") || document.createElement("section");
  const brandLink = document.createElement("a");
  const brandLogo = document.createElement("img");
  const column = document.createElement("div");
  const kicker = document.createElement("p");
  const list = document.createElement("ul");

  upperFooter.className = "upperfooter";
  upperFooter.setAttribute("aria-label", "OpsLaundry");
  brandLink.className = "footer-brand";
  brandLink.href = navigation.home;
  brandLogo.src = "/assets/brand/wordmark.svg";
  brandLogo.alt = "OpsLaundry";
  brandLogo.width = 760;
  brandLogo.height = 180;
  brandLogo.loading = "lazy";
  brandLogo.decoding = "async";
  brandLink.append(brandLogo);
  column.className = "upperfooter-col upperfooter-col-main";
  kicker.className = "upperfooter-kicker";
  kicker.textContent = navigation.title;
  list.className = "upperfooter-list";

  for (const [text, href] of navigation.items) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = href;
    link.textContent = text;
    item.append(link);
    list.append(item);
  }

  column.append(kicker, list);
  upperFooter.replaceChildren(column);
  const identityColumn = panel.querySelector(".footer-disclosure-identity");
  if (identityColumn) identityColumn.prepend(brandLink);
  else panel.prepend(brandLink);
  const contactColumn = panel.querySelector(".footer-disclosure-meta");
  if (contactColumn) panel.insertBefore(upperFooter, contactColumn);
  else panel.append(upperFooter);
  upperFooterMount?.remove();

  toggle?.remove();
  panel.hidden = false;
  panel.removeAttribute("role");
  panel.removeAttribute("aria-label");
  control.classList.remove("is-open", "is-closing");
})();
