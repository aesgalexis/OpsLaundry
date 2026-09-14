import assert from "node:assert/strict";
import {test} from "node:test";
import {readFile} from "node:fs/promises";
import {createDocument} from "./test-dom.mjs";
import {setupSubmissionSteps} from "../site/features/submissions/steps.mjs";

async function fixture(run) {
  const doc = createDocument(await readFile("site/es/enviar-maquina/index.html", "utf8"));
  const elements = doc.querySelectorAll("*");
  for (const element of elements) {
    const query = element.querySelectorAll.bind(element);
    element.querySelectorAll = (selector) => selector.split(",").flatMap((part) => query(part.trim()));
    element.closest = (selector) => {
      let current = element;
      while (current) {
        if (selector === "main" ? current.node.tagName === "main" : current.classList.contains(selector.slice(1))) return current;
        current = current.parentNode;
      }
      return null;
    };
    element.classList.toggle = (name, enabled) => enabled ? element.classList.add(name) : element.classList.remove(name);
    element.events = {};
    element.addEventListener = (name, callback) => { element.events[name] = callback; };
    element.focus = () => { doc.focused = element; };
    element.scrollIntoView = () => {};
    element.dataset = {template: element.getAttribute("data-template")};
    element.value = element.getAttribute("value") || "";
    element.tagName = element.node.tagName?.toUpperCase();
    element.valid = true;
    element.checkValidity = () => element.valid;
    element.reportValidity = () => { doc.invalid = element; return element.valid; };
    element.labels = doc.querySelectorAll("label").filter((label) =>
      label.getAttribute("for") === element.getAttribute("id") && element.getAttribute("id"));
    element.selectedOptions = element.querySelectorAll("option").slice(0, 1);
  }
  const form = doc.querySelector("#machine-submission");
  const images = doc.querySelector("#images");
  images.files = [];
  const original = globalThis.document;
  const originalWindow = globalThis.window;
  globalThis.document = doc;
  globalThis.window = {scrollTo: (options) => { doc.lastScroll = options; }};
  try {
    const steps = setupSubmissionSteps(form, {
      validateImages: () => images.files.length > 0, clearStatus() {}});
    await run({doc, form, images, steps, panels: form.querySelectorAll("[data-submission-step]"),
      next: form.querySelector("[data-submission-next]"), back: form.querySelector("[data-submission-back]")});
  } finally { globalThis.document = original; globalThis.window = originalWindow; }
}

test("empty required fields block navigation in every environment", async () => {
  await fixture(({doc, panels, next, steps}) => {
    doc.querySelector("#marca").valid = false;
    next.events.click(); next.events.click();
    assert.equal(panels[0].hidden, false);
    assert.deepEqual(doc.lastScroll, {top: 0, left: 0, behavior: "instant"});
    assert.equal(steps.validateSubmit(), false);
    assert.equal(panels[0].hidden, false);
  });
});

test("proposal steps validate before advancing, retain fields/photos on back, and summarize safely", async () => {
  await fixture(({doc, panels, next, back, images, steps}) => {
    const brand = doc.querySelector("#marca");
    brand.valid = false;
    next.events.click();
    assert.equal(panels[0].hidden, false);
    assert.equal(doc.invalid, brand);
    brand.valid = true; brand.value = "<Example>";
    assert.equal(steps.validateSubmit(), false, "Enter advances instead of sending the first step");
    assert.equal(panels[1].hidden, false);
    next.events.click();
    assert.equal(panels[1].hidden, false, "photos are required before contact");
    images.files = [{name: "machine.jpg"}];
    next.events.click();
    assert.equal(panels[2].hidden, false);
    const summary = doc.querySelector("[data-submission-summary]");
    assert.ok(summary.textContent.includes("<Example>"));
    assert.ok(summary.textContent.includes("machine.jpg"));
    assert.equal(summary.querySelector("example"), null, "summary values remain text");
    back.events.click(); back.events.click();
    assert.equal(brand.value, "<Example>");
    assert.equal(images.files.length, 1);
  });
});

test("final validation returns to an invalid earlier step and submission locks navigation until retry", async () => {
  await fixture(({doc, panels, images, next, back, steps}) => {
    images.files = [{name: "machine.jpg"}];
    next.events.click(); next.events.click();
    const brand = doc.querySelector("#marca");
    brand.valid = false;
    assert.equal(steps.validateSubmit(), false);
    assert.equal(panels[0].hidden, false);
    brand.valid = true;
    next.events.click(); next.events.click();
    assert.equal(steps.validateSubmit(), true);
    steps.setBusy(true);
    back.events.click();
    assert.equal(panels[2].hidden, false);
    assert.ok(panels.every((panel) => panel.inert));
    assert.equal(steps.validateSubmit(), false);
    steps.setBusy(false);
    back.events.click();
    assert.equal(panels[1].hidden, false);
    assert.ok(panels.every((panel) => !panel.inert));
  });
});
