export function setupSubmissionSteps(form, {validateImages, clearStatus}) {
  const panels = [...form.querySelectorAll("[data-submission-step]")];
  const page = form.closest("main");
  const indicators = [...page.querySelectorAll("[data-submission-indicator]")];
  const next = form.querySelector("[data-submission-next]");
  const back = form.querySelector("[data-submission-back]");
  const submit = form.querySelector('[type="submit"]');
  const count = page.querySelector("[data-step-count]");
  const summary = form.querySelector("[data-submission-summary]");
  let current = 0;
  let busy = false;

  function updateSummary() {
    summary.replaceChildren();
    const add = (label, value) => {
      const term = document.createElement("dt");
      const detail = document.createElement("dd");
      term.textContent = label.replace(/\s*\*$/, "");
      detail.textContent = value;
      summary.append(term, detail);
    };
    for (const field of panels[0].querySelectorAll("input, select, textarea")) {
      if (field.disabled || field.closest(".form-field")?.hidden) continue;
      const label = field.labels?.[0]?.textContent?.trim();
      if (!label || (field.type === "checkbox" && !field.checked)) continue;
      const value = field.type === "checkbox" ? "✓"
        : field.tagName === "SELECT" ? field.selectedOptions[0]?.textContent : field.value;
      if (field.value && value) add(label, value);
    }
    add(panels[1].querySelector("h2").textContent,
      [...form.querySelector('#images').files].map((file) => file.name).join(", "));
  }

  function show(index, focus = true) {
    current = index;
    panels.forEach((panel, i) => { panel.hidden = i !== index; });
    indicators.forEach((indicator, i) => {
      indicator.classList.toggle("is-complete", i < index);
      indicator.classList.toggle("is-active", i === index);
      if (i === index) indicator.setAttribute("aria-current", "step");
      else indicator.removeAttribute("aria-current");
    });
    count.textContent = count.dataset.template.replace("{n}", index + 1);
    back.hidden = index === 0;
    next.hidden = index === panels.length - 1;
    submit.hidden = index !== panels.length - 1;
    if (index === panels.length - 1) updateSummary();
    if (focus) {
      const heading = panels[index].querySelector("h2");
      heading.focus({preventScroll: true});
      window.scrollTo({top: 0, left: 0, behavior: "instant"});
    }
  }

  function validate(index) {
    if (index === 1 && !validateImages()) {
      show(index);
      form.querySelector('#images').focus({preventScroll: true});
      return false;
    }
    for (const field of panels[index].querySelectorAll("input, select, textarea")) {
      if (!field.checkValidity()) {
        show(index);
        field.reportValidity();
        return false;
      }
    }
    return true;
  }

  const advance = () => {
    if (busy) return;
    clearStatus();
    if (validate(current)) show(current + 1);
  };
  next.addEventListener("click", advance);
  back.addEventListener("click", () => {
    if (!busy) { clearStatus(); show(current - 1); }
  });
  form.noValidate = true;
  page.querySelector(".submission-progress-wrap").hidden = false;
  form.querySelector(".submission-summary").hidden = false;
  show(0, false);
  return {
    validateSubmit() {
      if (busy) return false;
      if (current < panels.length - 1) { advance(); return false; }
      return panels.every((_panel, index) => validate(index));
    },
    setBusy(value) {
      busy = value;
      next.disabled = back.disabled = value;
      panels.forEach((panel) => { panel.inert = value; });
      form.setAttribute("aria-busy", String(value));
    },
  };
}
