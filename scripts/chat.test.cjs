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
const { mergeChatMessages, canGroupChatMessages, buildChatMessageRows } =
  loaded.exports;
const message = (key, extra = {}) => ({
  id: key,
  clientMessageId: key,
  conversationId: "conversation",
  senderId: "student",
  senderRole: "STUDENT",
  type: "TEXT",
  createdAt: "2026-11-04T01:00:00Z",
  ...extra,
});

test("mobile groups through 60 seconds and separates anything over a minute", () => {
  const first = message("first");
  assert.equal(canGroupChatMessages(first, message("same-time")), true);
  assert.equal(
    canGroupChatMessages(
      first,
      message("boundary", { createdAt: "2026-11-04T01:01:00.000Z" }),
    ),
    true,
  );
  assert.equal(
    canGroupChatMessages(
      first,
      message("over", { createdAt: "2026-11-04T01:01:00.001Z" }),
    ),
    false,
  );
});

test("each consecutive message extends the group without repeating its receipt", () => {
  const rows = buildChatMessageRows([
    message("first"),
    message("second", { createdAt: "2026-11-04T01:00:45Z" }),
    message("third", { createdAt: "2026-11-04T01:01:30Z" }),
  ]);
  assert.deepEqual(
    rows.map((row) => row.startsGroup),
    [true, false, false],
  );
  assert.deepEqual(
    rows.filter((row) => row.endsGroup).map((row) => row.message.id),
    ["third"],
  );
  assert.equal([...rows].reverse()[0].endsGroup, true);
});

test("switching sender, role or conversation starts a separate group", () => {
  for (const extra of [
    { senderId: "staff" },
    { senderRole: "STAFF" },
    { conversationId: "other" },
  ]) {
    assert.equal(
      canGroupChatMessages(message("first"), message("second", extra)),
      false,
    );
  }
  assert.equal(canGroupChatMessages(undefined, message("first")), false);
  assert.equal(canGroupChatMessages(message("last"), undefined), false);
});

test("a system event splits message groups and internal notes never reach rendered rows", () => {
  const rows = buildChatMessageRows([
    message("before"),
    message("system", { type: "SYSTEM" }),
    message("after"),
    message("private", { type: "NOTE" }),
  ]);
  assert.deepEqual(
    rows.map((row) => row.message.id),
    ["before", "system", "after"],
  );
  assert.deepEqual(
    rows.map((row) => row.startsGroup),
    [true, true, true],
  );
  assert.equal(
    canGroupChatMessages(message("note", { type: "NOTE" }), message("text")),
    false,
  );
  assert.equal(
    canGroupChatMessages(message("text"), message("note", { type: "NOTE" })),
    false,
  );
});

test("pending and failed messages keep their individual status and retry target", () => {
  const failed = message("retry-uuid", { delivery: "failed" });
  const rows = buildChatMessageRows([
    message("delivered"),
    message("pending", { delivery: "sending" }),
    failed,
    message("later"),
  ]);
  assert.equal(
    rows.every((row) => row.startsGroup && row.endsGroup),
    true,
  );
  assert.equal(rows[2].message, failed);
});

test("older pages and new realtime arrivals keep one receipt at the group end", () => {
  const first = message("first");
  const second = message("second", { createdAt: "2026-11-04T01:00:30Z" });
  const latest = message("latest", { createdAt: "2026-11-04T01:00:50Z" });
  const initial = buildChatMessageRows([second]);
  assert.equal(initial[0].startsGroup, true);
  const paginated = buildChatMessageRows(mergeChatMessages([second], [first]));
  assert.equal(paginated[1].startsGroup, false);
  const refreshed = buildChatMessageRows(
    mergeChatMessages([first, second], [latest, latest]),
  );
  assert.deepEqual(
    refreshed.filter((row) => row.endsGroup).map((row) => row.message.id),
    ["latest"],
  );
});

test("date changes split groups and longer gaps produce a time separator", () => {
  const before = message("before", {
    createdAt: new Date(2026, 10, 4, 23, 59, 50).toISOString(),
  });
  const after = message("after", {
    createdAt: new Date(2026, 10, 5, 0, 0, 10).toISOString(),
  });
  assert.equal(canGroupChatMessages(before, after), false);
  assert.deepEqual(
    buildChatMessageRows([before, after]).map((row) => row.separator),
    ["date", "date"],
  );
  const later = message("later", { createdAt: "2026-11-04T01:02:00Z" });
  assert.equal(
    buildChatMessageRows([message("first"), later])[1].separator,
    "time",
  );
});

test("image and file messages can share a group while invalid or reversed dates cannot", () => {
  assert.equal(
    canGroupChatMessages(
      message("image", { type: "IMAGE" }),
      message("file", { type: "FILE" }),
    ),
    true,
  );
  assert.equal(
    canGroupChatMessages(
      message("invalid", { createdAt: "invalid" }),
      message("normal"),
    ),
    false,
  );
  assert.equal(
    canGroupChatMessages(
      message("later", { createdAt: "2026-11-04T01:01:00Z" }),
      message("earlier"),
    ),
    false,
  );
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
