import assert from "node:assert/strict";
import {test} from "node:test";
import {readFile} from "node:fs/promises";
import {subscribeWhileVisible} from "../site/shared/page-subscription.mjs";
import {fetchMachines} from "./generate-machinery-pages.mjs";

const importBrowserModule = async (file) => import(`data:text/javascript;base64,${Buffer.from(await readFile(file)).toString("base64")}`);

test("contact ignores concurrent submissions and permits a manual retry after failure", async () => {
  const {initContactForm} = await importBrowserModule("site/features/contact/form-controller.js");
  const events = {};
  const button = {disabled: false};
  const status = {dataset: {}};
  const form = {dataset: {}, action: "https://example.test/contact", method: "POST",
    querySelector: (selector) => selector === ".form-status" ? status : selector.includes("button") ? button : null,
    querySelectorAll: () => [], addEventListener: (name, callback) => { events[name] = callback; },
    checkValidity: () => true, reset() {},
  };
  const originalFetch = globalThis.fetch;
  const originalFormData = globalThis.FormData;
  let calls = 0;
  let finish;
  globalThis.FormData = class {};
  globalThis.fetch = () => { calls++; return new Promise((resolve) => { finish = resolve; }); };
  try {
    initContactForm(form, {language: "es"});
    const event = {preventDefault() {}};
    const first = events.submit(event);
    await events.submit(event);
    assert.equal(calls, 1);
    assert.equal(button.disabled, true);
    finish({ok: false}); await first;
    assert.equal(button.disabled, false);
    const retry = events.submit(event);
    assert.equal(calls, 2);
    finish({ok: true}); await retry;
    assert.equal(status.dataset.state, "success");
  } finally { globalThis.fetch = originalFetch; globalThis.FormData = originalFormData; }
});

test("image validation runs before decoding even without a change event", async () => {
  const {prepareImages} = await importBrowserModule("site/shared/forms/image-upload.js");
  await assert.rejects(prepareImages({files: Array(5).fill({type: "image/jpeg", size: 1})}), /images-too-many/u);
  await assert.rejects(prepareImages({files: [{type: "image/jpeg", size: 9 * 1024 * 1024}]}), /images-too-large/u);
  await assert.rejects(prepareImages({files: [{type: "text/html", size: 1}]}), /image-wrong-type/u);
  assert.deepEqual(await prepareImages({files: []}), []);
});

test("live data unsubscribes in background and resumes once after BFCache restore", () => {
  const page = new EventTarget(); page.hidden = false;
  const lifecycle = new EventTarget();
  let active = 0; let starts = 0;
  const dispose = subscribeWhileVisible(() => { active++; starts++; return () => { active--; }; }, page, lifecycle);
  assert.equal(active, 1);
  page.hidden = true; page.dispatchEvent(new Event("visibilitychange"));
  assert.equal(active, 0);
  page.hidden = false; page.dispatchEvent(new Event("visibilitychange"));
  lifecycle.dispatchEvent(new Event("pageshow"));
  assert.equal(active, 1); assert.equal(starts, 2);
  lifecycle.dispatchEvent(new Event("pagehide"));
  assert.equal(active, 0);
  lifecycle.dispatchEvent(new Event("pageshow"));
  assert.equal(active, 1);
  dispose(); lifecycle.dispatchEvent(new Event("pageshow"));
  assert.equal(active, 0); assert.equal(starts, 3);
});

test("build OAuth token stays in headers across pagination", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(options.headers.Authorization, "Bearer test-build-token");
    assert.ok(!String(url).includes("test-build-token"));
    if (calls === 2) assert.equal(url.searchParams.get("pageToken"), "next");
    return {ok: true, json: async () => calls === 1 ? {nextPageToken: "next"} : {}};
  };
  try {
    assert.deepEqual(await fetchMachines({projectId: "test", accessToken: "test-build-token"}), []);
    assert.equal(calls, 2);
  } finally { globalThis.fetch = original; }
});
