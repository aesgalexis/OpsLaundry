(() => {
  const language = (document.documentElement.lang || "es").slice(0, 2).toLowerCase();
  const localizedLanguage = ["es", "en", "it", "el"].includes(language) ? language : "es";
  const directRoutes = new Map([
    ["/", `/${localizedLanguage}/`],
    ["", `/${localizedLanguage}/`],
  ]);
  const resolveDirectRoute = (value) => {
    if (!value) return "";
    try {
      const url = new URL(value, window.location.origin);
      if (url.origin !== window.location.origin && url.origin !== "https://opslaundry.com") return "";
      const pathname = directRoutes.get(url.pathname);
      return pathname ? `${pathname}${url.search}${url.hash}` : "";
    } catch {
      return "";
    }
  };

  document.querySelectorAll("a[href]").forEach((link) => {
    const directHref = resolveDirectRoute(link.getAttribute("href"));
    if (directHref) link.setAttribute("href", directHref);
  });
  const directBackHref = resolveDirectRoute(document.body.dataset.backHref);
  if (directBackHref) document.body.dataset.backHref = directBackHref;

  if (document.getElementById("tagline-rotation-text")) {
    const claimLoopScript = document.createElement("script");
    claimLoopScript.src = "/shared/ui/tagline-rotation.js";
    document.head.appendChild(claimLoopScript);
  }

  const toggle = document.getElementById("lang-toggle");
  const menu = document.getElementById("lang-menu");
  if (!toggle || !menu) return;
  const languageLabels = {
    es: ["Cambiar idioma, actual: español", "Seleccionar idioma"],
    en: ["Change language, current: English", "Select language"],
    it: ["Cambia lingua, attuale: italiano", "Seleziona lingua"],
    el: ["Αλλαγή γλώσσας, τρέχουσα: ελληνικά", "Επιλογή γλώσσας"],
  }[localizedLanguage];
  toggle.setAttribute("aria-label", languageLabels[0]);
  toggle.setAttribute("aria-haspopup", "menu");
  menu.setAttribute("aria-label", languageLabels[1]);
  const options = Array.from(menu.querySelectorAll(".lang-option"));
  options.forEach((option) => { option.tabIndex = -1; });
  const closeMenu = (restoreFocus = false) => {
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    if (restoreFocus) toggle.focus();
  };
  const openMenu = (index = 0) => {
    menu.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    options[index]?.focus();
  };
  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    if (menu.hidden) openMenu();
    else closeMenu(true);
  });
  toggle.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    openMenu(event.key === "ArrowUp" ? options.length - 1 : 0);
  });
  menu.addEventListener("keydown", (event) => {
    const index = options.indexOf(document.activeElement);
    let next;
    if (event.key === "ArrowDown") next = (index + 1) % options.length;
    else if (event.key === "ArrowUp") next = (index - 1 + options.length) % options.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    else if (event.key === "Tab") {
      // Let native Tab move beyond the trigger once the menu is closed.
      closeMenu(true);
      return;
    } else if (event.key === " ") {
      event.preventDefault();
      options[index]?.click();
      return;
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const letter = event.key.toLocaleLowerCase(localizedLanguage);
      next = options.findIndex((option, candidate) => candidate > index && option.textContent.trim().toLocaleLowerCase(localizedLanguage).startsWith(letter));
      if (next < 0) next = options.findIndex((option) => option.textContent.trim().toLocaleLowerCase(localizedLanguage).startsWith(letter));
      if (next < 0) return;
    } else return;
    event.preventDefault();
    options[next]?.focus();
  });
  menu.addEventListener("click", () => closeMenu(true));
  document.addEventListener("click", (event) => {
    if (!menu.hidden && !menu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
  });
  document.addEventListener("focusin", (event) => {
    if (!menu.hidden && !menu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) {
      event.preventDefault();
      closeMenu(true);
    }
  });
})();
