import assert from "node:assert/strict";
import { test } from "node:test";
import * as tags from "../utils/tags.ts";

const cursorAt = (position) => ({ start: position, end: position });
const result = (text, cursor) => ({ text, selection: cursorAt(cursor) });

test("B1: insertAtCursor inserts at start, middle, end and replaces a selection", () => {
  assert.deepEqual(tags.insertAtCursor("abcd", cursorAt(0), "XY"), result("XYabcd", 2));
  assert.deepEqual(tags.insertAtCursor("abcd", cursorAt(2), "XY"), result("abXYcd", 4));
  assert.deepEqual(tags.insertAtCursor("abcd", cursorAt(4), "XY"), result("abcdXY", 6));
  assert.deepEqual(tags.insertAtCursor("abcd", { start: 1, end: 3 }, "タグ"), result("aタグd", 3));
  assert.deepEqual(tags.insertAtCursor("abcd", { start: 1, end: 3 }, ""), result("ad", 1));
});

test("B2: insertHash respects text, line and whitespace boundaries", () => {
  for (const prefix of ["", "タスク\n", "タスク ", "タスク\t", "タスク\u3000"]) {
    assert.deepEqual(tags.insertHash(`${prefix}次`, cursorAt(prefix.length)),
      result(`${prefix}#次`, prefix.length + 1));
  }
  assert.deepEqual(tags.insertHash("タスク", cursorAt(3)), result("タスク #", 5));
  assert.deepEqual(tags.insertHash("前選択後", { start: 1, end: 3 }), result("前 #後", 3));
  assert.deepEqual(tags.insertHash("選択後", { start: 0, end: 2 }), result("#後", 1));
});

test("B3: applyTagChip replaces the whole active token and collapses after the space", () => {
  const text = "前\n予定 #朝ごはん\n次 #仕事";
  const start = text.indexOf("#朝");
  assert.deepEqual(tags.applyTagChip(text, cursorAt(start + 2), "朝活"),
    result("前\n予定 #朝活 \n次 #仕事", start + "#朝活 ".length));
  assert.deepEqual(tags.applyTagChip("#朝", cursorAt(2), "朝活"), result("#朝活 ", 4));
  assert.deepEqual(tags.applyTagChip("#朝 後", cursorAt(1), "朝活"), result("#朝活 後", 4));
  assert.deepEqual(tags.applyTagChip("#朝\t後", cursorAt(2), "朝活"), result("#朝活 \t後", 4));
});

test("B4: applyTagChip inserts outside a token with a separating space when needed", () => {
  assert.deepEqual(tags.applyTagChip("", cursorAt(0), "タグ"), result("#タグ ", 4));
  assert.deepEqual(tags.applyTagChip("予定 ", cursorAt(3), "タグ"), result("予定 #タグ ", 7));
  assert.deepEqual(tags.applyTagChip("予定後", cursorAt(2), "タグ"), result("予定 #タグ 後", 7));
  assert.deepEqual(tags.applyTagChip("前\n後", cursorAt(2), "タグ"), result("前\n#タグ 後", 6));
  assert.deepEqual(tags.applyTagChip("前選択後", { start: 1, end: 3 }, "タグ"), result("前 #タグ 後", 6));
});

test("B5: toolbarState filters the cursor prefix with NFC and case folding, newest first", () => {
  const history = ["朝活", "仕事", "朝食", "Café", "CAFE\u0301teria"];
  const original = [...history];
  assert.deepEqual(tags.toolbarState("#朝ごはん", cursorAt(2), history),
    { mode: "prefix", query: "朝", candidates: ["朝食", "朝活"] });
  assert.deepEqual(tags.toolbarState("#cafe\u0301", cursorAt(6), history),
    { mode: "prefix", query: "cafe\u0301", candidates: ["CAFE\u0301teria", "Café"] });
  assert.deepEqual(tags.toolbarState("#", cursorAt(1), history),
    { mode: "prefix", query: "", candidates: [...history].reverse() });
  assert.deepEqual(history, original);
});

test("B6: toolbarState returns the complete history newest first outside a tag", () => {
  const history = ["古い", "中間", "新しい"];
  for (const [text, selection] of [["予定", cursorAt(2)], ["#朝", cursorAt(0)],
    ["#朝", { start: 1, end: 2 }], ["#朝 ", cursorAt(3)]]) {
    assert.deepEqual(tags.toolbarState(text, selection, history),
      { mode: "history", query: "", candidates: ["新しい", "中間", "古い"] });
  }
  assert.deepEqual(tags.toolbarState("", cursorAt(0), []),
    { mode: "history", query: "", candidates: [] });
});

test("B7: toolbarState returns no candidates when no history prefix matches", () => {
  assert.deepEqual(tags.toolbarState("#夜", cursorAt(2), ["朝活", "仕事"]),
    { mode: "prefix", query: "夜", candidates: [] });
  assert.deepEqual(tags.toolbarState("#", cursorAt(1), []),
    { mode: "prefix", query: "", candidates: [] });
});

test("B8: toolbarState ignores tags on other lines, word fragments, URLs and invalid hashes", () => {
  const history = ["朝活", "仕事"];
  for (const [text, position] of [["#朝\n予定", 5], ["予定\n#朝", 2], ["単語#朝", 4],
    ["https://example.com/#朝", 22], ["##朝", 3], ["##", 1], ["(#朝", 3], ["# 朝", 3]]) {
    assert.deepEqual(tags.toolbarState(text, cursorAt(Math.min(position, text.length)), history),
      { mode: "history", query: "", candidates: ["仕事", "朝活"] });
  }
  assert.deepEqual(tags.toolbarState("#仕事\n#朝", cursorAt(6), history),
    { mode: "prefix", query: "朝", candidates: ["朝活"] });
});
