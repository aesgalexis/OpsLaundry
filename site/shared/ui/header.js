(() => {
  const topbar = document.querySelector("#topbar-mount .topbar");
  if (!topbar) return;
  const laundryLogo =
    "/assets/brand/wordmark.svg";
  const logo = topbar.querySelector(".topbar-logo");
  if (logo) {
    logo.src = laundryLogo;
    logo.alt = "OpsLaundry";
    logo.classList.add("topbar-logo--wordmark");
  }
  const name = topbar.querySelector(".topbar-name");
  if (name) {
    name.replaceChildren();
    name.hidden = true;
  }
  topbar.classList.remove("is-hidden");
})();
