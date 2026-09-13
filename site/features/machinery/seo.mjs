import {SITE, LOCALES, machineRoute, publicImageUrl, translate} from "./presentation.mjs";

export const machineMetadata = (machine, lang, copy) => {
  const name = `${machine.marca || ""} ${machine.modelo || ""}`.trim();
  const url = `${SITE}${machineRoute(lang, machine.id)}`;
  const description = String(machine.comentarios || `${LOCALES[lang].description} ${name}.`).slice(0, 160);
  const images = (Array.isArray(machine.imagenes) ? machine.imagenes : []).map(publicImageUrl).filter(Boolean);
  const schema = {
    "@context": "https://schema.org", "@type": "Product", "@id": `${url}#product`,
    name, url, sku: machine.id, description,
    category: translate(copy.typeLabels, machine.categoria),
    itemCondition: "https://schema.org/UsedCondition",
    brand: {"@type": "Brand", name: machine.marca},
  };
  if (machine.modelo) schema.model = machine.modelo;
  if (images.length) schema.image = images;
  // A quote-only listing must not claim an Offer with a missing or invented price.
  if (Number.isFinite(machine.precioAmount) && machine.precioAmount >= 0) {
    schema.offers = {"@type": "Offer", availability: "https://schema.org/InStock",
      priceCurrency: "EUR", price: String(machine.precioAmount), url};
  }
  return {title: `${name} | OpsLaundry`, description, url, image: images[0] || "",
    imageAlt: name, schema};
};
export const serializeSchema = (schema) => JSON.stringify(schema).replaceAll("<", "\\u003c");

export function updateMachineMetadata(document, machine, lang, copy) {
  const json = document.querySelector('script[type="application/ld+json"]');
  const robots = document.querySelector('meta[name="robots"]');
  if (!machine || machine.visible === false) {
    json?.remove();
    if (robots) robots.content = "noindex, follow";
    return;
  }
  const meta = machineMetadata(machine, lang, copy);
  document.title = meta.title;
  if (robots) robots.content = "index, follow";
  const setMeta = (attribute, name, content) => {
    let element = document.querySelector(`meta[${attribute}="${name}"]`);
    if (!content) { element?.remove(); return; }
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(attribute, name);
      document.head.append(element);
    }
    element.content = content;
  };
  setMeta("name", "description", meta.description);
  for (const [key, value] of Object.entries({title: meta.title, description: meta.description,
    url: meta.url, image: meta.image, "image:alt": meta.image ? meta.imageAlt : ""})) {
    setMeta("property", `og:${key}`, value);
  }
  for (const key of ["width", "height"]) setMeta("property", `og:image:${key}`, "");
  const schema = json || document.createElement("script");
  schema.type = "application/ld+json";
  schema.textContent = serializeSchema(meta.schema);
  if (!json) document.head.append(schema);
}
