const assert = require("node:assert/strict");
const { test } = require("node:test");
const ts = require("typescript");
const fs = require("node:fs");
const path = require("node:path");
const filename = path.join(__dirname, "../src/features/chat/chat-state.ts");
const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const loaded = { exports: {} };
new Function("exports", "module", output)(loaded.exports, loaded);
const { mergeChatMessages } = loaded.exports;
const message = (key, extra = {}) => ({
  id: key,
  clientMessageId: key,
  type: "TEXT",
  createdAt: "2026-11-04T01:00:00Z",
  ...extra,
});
test("mobile reconciles retries and websocket echoes by the original UUID", () => {
  const result = mergeChatMessages(
    [message("uuid", { delivery: "failed" })],
    [
      message("uuid", { id: "persisted" }),
      message("uuid", { id: "persisted" }),
    ],
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "persisted");
  assert.equal(result[0].delivery, undefined);
});
test("mobile excludes accidental internal notes defensively", () => {
  assert.deepEqual(
    mergeChatMessages([], [message("note", { type: "NOTE" })]),
    [],
  );
});
test("older mobile pages sort by timestamp then stable message id", () => {
  assert.deepEqual(
    mergeChatMessages(
      [message("z")],
      [message("a"), message("older", { createdAt: "2026-11-03T01:00:00Z" })],
    ).map((m) => m.id),
    ["older", "a", "z"],
  );
});
