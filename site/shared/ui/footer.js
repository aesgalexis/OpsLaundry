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

  const about = document.createElement("p");
  about.className = "footer-about-title footer-disclosure-contact-title";
  const aboutLink = document.createElement("a");
  aboutLink.className = "footer-disclosure-contact-form-link";
  const aboutIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  aboutIcon.setAttribute("viewBox", "0 0 24 24");
  aboutIcon.setAttribute("fill", "none");
  aboutIcon.setAttribute("stroke", "currentColor");
  aboutIcon.setAttribute("stroke-width", "1.7");
  aboutIcon.setAttribute("stroke-linecap", "round");
  aboutIcon.setAttribute("stroke-linejoin", "round");
  aboutIcon.setAttribute("aria-hidden", "true");
  aboutIcon.setAttribute("focusable", "false");
  const aboutIconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  aboutIconPath.setAttribute("d", "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0");
  aboutIcon.append(aboutIconPath);
  const aboutLabel = document.createElement("span");
  aboutLabel.textContent = {es: "Nosotros", en: "About us", it: "Chi siamo", el: "Ποιοι είμαστε"}[lang] || "About us";
  aboutLink.append(aboutIcon);
  aboutLink.setAttribute("aria-label", {es: "Conocer OpsLaundry", en: "About OpsLaundry", it: "Scopri OpsLaundry", el: "Γνώρισε την OpsLaundry"}[lang] || "About OpsLaundry");
  about.append(aboutLabel, aboutLink);
  const aboutRoutes = {es: "/es/nosotros/", en: "/en/about-us/", it: "/it/chi-siamo/", el: "/el/poioi-eimaste/"};
  aboutLink.href = aboutRoutes[lang] || aboutRoutes.en;
  if (window.location.pathname === aboutLink.getAttribute("href")) aboutLink.setAttribute("aria-current", "page");
  column.append(kicker, list);
  upperFooter.replaceChildren(column);
  const identityColumn = panel.querySelector(".footer-disclosure-identity");
  if (identityColumn) identityColumn.prepend(brandLink);
  else panel.prepend(brandLink);
  const contactColumn = panel.querySelector(".footer-disclosure-meta");
  if (contactColumn) contactColumn.prepend(about);
  if (contactColumn) panel.insertBefore(upperFooter, contactColumn);
  else panel.append(upperFooter);
  upperFooterMount?.remove();

  toggle?.remove();
  panel.hidden = false;
  panel.removeAttribute("role");
  panel.removeAttribute("aria-label");
  control.classList.remove("is-open", "is-closing");
})();
