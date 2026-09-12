// Conditional fields shared by the public proposal and private review forms.
export function setupMachineFields(form) {
  const category = form.elements.categoria;
  const heating = form.elements.calefaccion;
  const warranty = form.elements.garantiaTipo;
  const months = form.elements.garantiaDetalle;
  const sync = () => {
    const dryer = category.value === "Secadora";
    heating.closest(".form-field").hidden = !dryer;
    if (!dryer) heating.value = "";
    months.closest(".form-field").hidden = !warranty.value;
    months.required = !!warranty.value;
    if (!warranty.value) months.value = "";
  };
  category.addEventListener("change", sync);
  warranty.addEventListener("change", sync);
  sync();
}
