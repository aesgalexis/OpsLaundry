(() => {
  // Only the neutral entry point chooses a language; localized links keep theirs.
  if (location.pathname !== "/" && location.pathname !== "/index.html") return;
  const supported = new Set(["es", "en", "it", "el"]);
  let language = "es";
  try {
    const preferences = [...(navigator.languages || []), navigator.language];
    language = preferences
      .filter((value) => typeof value === "string")
      .map((value) => value.trim().toLowerCase().split(/[-_]/)[0])
      .find((value) => supported.has(value)) || "es";
  } catch { /* Keep the Spanish fallback when preferences are unavailable. */ }
  location.replace(`/${language}/${location.search}${location.hash}`);
})();
