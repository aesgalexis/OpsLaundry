import {initContactForm} from "/features/contact/form-controller.js";

const form = document.querySelector(".contact-form");

if (form) {
  const params = new URLSearchParams(window.location.search);
  const context = new URLSearchParams();
  for (const key of ["subject", "type", "brand", "model", "year", "id", "machine"]) {
    const value = (params.get(key) || "").trim();
    if (value) context.set(key, value);
  }
  const contextField = form.elements.namedItem("context");
  if (contextField && context.size) {
    const contextValue = context.toString();
    contextField.value = contextValue;
    contextField.defaultValue = contextValue;
  }

  initContactForm(form);
}
