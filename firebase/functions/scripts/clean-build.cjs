const {rmSync} = require("node:fs");
const {join} = require("node:path");

rmSync(join(__dirname, "..", "lib"), {recursive: true, force: true});
