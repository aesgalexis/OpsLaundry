const assert = require("node:assert/strict");
const {test} = require("node:test");
const {projectPublicMachine, reconcilePublicMachine, ADMIN_MACHINES, PUBLIC_MACHINES} =
  require("../lib/machinery/public-projection");
const machine = {categoria: "Lavadora", marca: "Example", visible: true,
  createdBy: "private@example.test", contact: {email: "seller@example.test"},
  imagenes: [{url: "https://example.test/photo.jpg", path: "internal/path", name: "private-name"}],
  precioAmount: 1200};

test("projection drops identities, internal image fields and arbitrary nested data", () => {
  const data = projectPublicMachine("L001", {...machine, id: "spoofed", modelo: {private: "secret"}});
  assert.equal(data.id, "L001");
  assert.equal(data.modelo, "");
  assert.deepEqual(data.imagenes, ["https://example.test/photo.jpg"]);
  assert.equal(data.precioAmount, 1200);
  for (const word of ["private", "seller", "internal", "createdBy", "contact", "spoofed"]) {
    assert.ok(!JSON.stringify(data).includes(word));
  }
  assert.equal(projectPublicMachine("L001", {...machine, visible: false}), null);
  assert.equal(projectPublicMachine("L001", undefined), null);
  assert.deepEqual(projectPublicMachine("L001", {...machine,
    imagenes: ["javascript:alert(1)", "https://user:password@example.test/a", {}]}).imagenes, []);
});

test("repeated reconciliation uses current source, replaces leaked fields and removes withdrawn/deleted machines", async () => {
  const records = new Map([[`${ADMIN_MACHINES}/L001`, machine],
    [`${PUBLIC_MACHINES}/L001`, {createdBy: "old leak"}]]);
  const db = {collection: (name) => ({doc: (id) => ({path: `${name}/${id}`})}),
    runTransaction: async (fn) => fn({
      get: async (ref) => ({exists: records.has(ref.path), data: () => records.get(ref.path)}),
      set: (ref, data) => records.set(ref.path, data), delete: (ref) => records.delete(ref.path),
    })};
  await reconcilePublicMachine(db, "L001");
  assert.deepEqual(records.get(`${PUBLIC_MACHINES}/L001`), projectPublicMachine("L001", machine));
  records.set(`${ADMIN_MACHINES}/L001`, {...machine, visible: false});
  await reconcilePublicMachine(db, "L001");
  await reconcilePublicMachine(db, "L001"); // Delayed/repeated event cannot restore the old version.
  assert.equal(records.has(`${PUBLIC_MACHINES}/L001`), false);
  records.set(`${ADMIN_MACHINES}/L001`, {...machine, precioAmount: 900});
  await reconcilePublicMachine(db, "L001");
  assert.equal(records.get(`${PUBLIC_MACHINES}/L001`).precioAmount, 900);
  records.delete(`${ADMIN_MACHINES}/L001`);
  await reconcilePublicMachine(db, "L001");
  assert.equal(records.has(`${PUBLIC_MACHINES}/L001`), false);
});
