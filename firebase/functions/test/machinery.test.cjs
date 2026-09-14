const assert = require("node:assert/strict");
const {test} = require("node:test");
const {normalizeMachineSubmission, publicMachine} = require("../lib/machinery/submission-policy");
const {renderMachineSubmissionEmails} = require("../lib/machinery/emails");
const records = new Map();
const objects = new Map();
let failCopy = false;
let emails = [];
const snapshot = (path) => ({id: path.split("/").pop(), exists: records.has(path),
  data: () => records.get(path), ref: ref(path)});
function ref(path) {
  return {path, get: async () => snapshot(path),
    update: async (data) => records.set(path, {...records.get(path), ...data})};
}
function collection(name) {
  return {doc: (id) => ref(name + "/" + id), where: () => collection(name),
    get: async () => ({docs: [...records.keys()].filter((p) => p.startsWith(name + "/")).map(snapshot)})};
}
const db = {collection, runTransaction: async (fn) => {
  const writes = [];
  const result = await fn({
    get: (target) => target.get(),
    create: (target, data) => { assert.equal(records.has(target.path), false); writes.push([target.path, data]); },
    set: (target, data) => writes.push([target.path, data]),
    update: (target, data) => writes.push([target.path, {...records.get(target.path), ...data}]),
  });
  writes.forEach(([path, data]) => records.set(path, data));
  return result;
}};
const bucket = {name: "test-bucket", file: (path) => ({path,
  save: async (bytes) => objects.set(path, bytes),
  copy: async (target) => { if (failCopy) throw new Error("copy-failed"); objects.set(target.path, objects.get(path)); },
})};
function stub(path, exports) { require.cache[require.resolve(path)] = {exports}; }
stub("../lib/core/firebase", {db, admin: {storage: () => ({bucket: () => bucket}),
  firestore: {FieldValue: {serverTimestamp: () => "timestamp"}, FieldPath: {documentId: () => "__name__"}}}});
stub("../lib/spare-parts/rate-limit", {enforceSpareRequestRateLimit: async () => {}});
stub("../lib/email/delivery", {sendLaundryEmail: async (payload, key) => emails.push({payload, key})});
const {submitLaundryMachine, listLaundryMachineSubmissions, notifyLaundryMachineSubmission, getLaundryMachineSubmissionImage} = require("../lib/machinery/submissions");
const {reviewLaundryMachineSubmission} = require("../lib/machinery/submission-review");
const payload = {
  submissionId: "12345678-abcd-1234", contactName: "Test seller", email: "test@example.com",
  phone: "123456789", privacyAccepted: true, categoria: "Lavadora", marca: "Test",
  ubicacion: "Madrid", estado: "Usada", precio: "1000.50",
  images: [{name: "test.jpg", type: "image/jpeg", content: Buffer.from([255, 216, 255, 0]).toString("base64")}],
};
const owner = {uid: "admin-test", token: {laundryServicesAdmin: true}};
test("transactional frames localize confirmations, escape data and keep review links private", () => {
  for (const language of ["es", "en", "it", "el", "unknown"]) {
    const {internal, confirmation} = renderMachineSubmissionEmails("test-reference-123456", {
      language, contact: {name: "<script>Alexis</script>\u2014Test", email: "test@example.com", phone: "test", company: ""},
      draft: {marca: "<Brand>", modelo: "Model\u2014Test", precio: "0", envioIncluido: false}, imageCount: 1,
    });
    for (const email of [internal, confirmation]) {
      assert.ok(email.html.includes("max-width:600px"));
      assert.ok(!email.html.includes("<script>"));
      assert.ok(!email.html.includes("<pre>"));
      assert.ok(![email.html, email.text, email.subject].join("").includes("\u2014"));
      assert.ok(email.html.includes("&lt;Brand&gt;"));
    }
    assert.ok(internal.text.includes("Envío incluido: No"));
    assert.ok(internal.text.includes("Precio (EUR, sin impuestos): 0"));
    assert.ok(internal.html.includes("/requests/?request="));
    assert.ok(!confirmation.html.includes("/requests/"));
    assert.ok(confirmation.html.includes(`lang="${language === "unknown" ? "es" : language}"`));
  }
});
test("validation strips public/privileged fields and rejects invalid data", () => {
  const normalized = normalizeMachineSubmission({...payload, visible: true, createdBy: "attacker"});
  assert.equal(normalized.draft.visible, undefined);
  assert.equal(normalized.draft.envioIncluido, false);
  assert.equal(publicMachine(normalized.draft, "L001").precioAmount, 1000.5);
  for (const override of [{privacyAccepted: false}, {email: "invalid"}, {images: []},
    {categoria: "Invalid"}, {categoria: "constructor"}, {estado: "invalid"}, {capacidad: "-1"}, {anio: "1800"}, {precio: "-5"}, {garantiaTipo: "total", garantiaDetalle: ""}]) {
    assert.throws(() => normalizeMachineSubmission({...payload, ...override}));
  }
});
test("anonymous clients cannot list or approve", async () => {
  await assert.rejects(listLaundryMachineSubmissions.run({data: {}}), /admin-only/);
  await assert.rejects(reviewLaundryMachineSubmission.run({data: {}}), /admin-only/);
  await assert.rejects(getLaundryMachineSubmissionImage.run({data: {}}), /admin-only/);
});
test("submission, retry, approval recovery and duplicate approval", async () => {
  const call = {data: payload, rawRequest: {ip: "test"}};
  await submitLaundryMachine.run(call);
  await submitLaundryMachine.run(call);
  assert.equal(records.size, 1);
  const path = "laundry_machine_submissions/" + payload.submissionId;
  assert.equal(records.get(path).status, "pending");
  assert.ok([...objects.keys()].every((p) => p.startsWith("laundry-submissions/")));
  await assert.rejects(submitLaundryMachine.run({...call, data: {...payload, marca: "Changed"}}), /submission-id-used/);
  const approval = {auth: owner, data: {id: payload.submissionId, action: "approve", draft: {...payload, marca: "Reviewed"}}};
  failCopy = true;
  await assert.rejects(reviewLaundryMachineSubmission.run(approval), /copy-failed/);
  assert.equal(records.get(path).status, "approving");
  assert.equal(records.has("agregador_maquinaria_LS/L001"), false);
  failCopy = false;
  await reviewLaundryMachineSubmission.run(approval);
  await reviewLaundryMachineSubmission.run(approval);
  assert.equal(records.get(path).status, "approved");
  const machine = records.get("agregador_maquinaria_LS/L001");
  assert.equal(machine.marca, "Reviewed");
  assert.equal(machine.contact, undefined);
  assert.equal(machine.visible, true);
  assert.equal(records.get("maquinaria_counters/L").lastSeq, 1);
});
test("rejection never creates a public machine", async () => {
  const data = {...payload, submissionId: "22345678-abcd-1234"};
  await submitLaundryMachine.run({data, rawRequest: {ip: "test"}});
  await reviewLaundryMachineSubmission.run({auth: owner, data: {id: data.submissionId, action: "reject"}});
  assert.equal(records.get("laundry_machine_submissions/" + data.submissionId).status, "rejected");
  await assert.rejects(reviewLaundryMachineSubmission.run({auth: owner, data: {id: data.submissionId, action: "approve"}}), /already-rejected/);
});
test("notification uses fixed destination, escaped content and private review link", async () => {
  emails = [];
  const data = records.get("laundry_machine_submissions/" + payload.submissionId);
  await notifyLaundryMachineSubmission.run({params: {submissionId: payload.submissionId},
    data: {data: () => ({...data, contact: {...data.contact, name: "<script>"}}), ref: {update: async () => {}}}});
  assert.deepEqual(emails[0].payload.to, ["info@opslaundry.com"]);
  assert.ok(emails[0].payload.html.includes("&lt;script&gt;"));
  assert.doesNotMatch(emails[0].payload.html, /unatomo\.com/);
  assert.match(emails[1].payload.html, /opslaundry-wordmark-email\.png/);
  assert.ok(emails[0].payload.text.includes("/requests/?request="));
  assert.equal(emails[1].payload.to[0], "test@example.com");
});
