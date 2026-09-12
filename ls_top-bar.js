(() => {
  const topbar = document.querySelector("#ls-topbar-mount .ls-topbar");
  if (!topbar) return;
  const laundryLogo =
    "/static/img/logo-experiments/opslaundry-wordmark-navy-heavy.svg";
  const logo = topbar.querySelector(".ls-topbar-logo");
  if (logo) {
    logo.src = laundryLogo;
    logo.alt = "OpsLaundry";
    logo.classList.add("ls-topbar-logo--wordmark");
  }
  const name = topbar.querySelector(".ls-topbar-name");
  if (name) {
    name.replaceChildren();
    name.hidden = true;
  }
  topbar.classList.remove("is-hidden");
})();
