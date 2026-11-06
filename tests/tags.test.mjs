import assert from "node:assert/strict";
import { test } from "node:test";
import { completeTag, extractTags, getActiveTag, mergeTags, parseTagName, suggestTags } from "../utils/tags.ts";

const cursorAt = (position) => ({ start: position, end: position });

test("accepts manual tag names with an optional slash and rejects invalid names", () => {
  assert.equal(parseTagName(" /仕事 "), "仕事");
  assert.equal(parseTagName("project-1_a"), "project-1_a");
  assert.equal(parseTagName("/cafe\u0301"), "café");
  assert.deepEqual(mergeTags(["Work"], [parseTagName("/work")]), ["Work"]);
  for (const input of ["", " ", "/", "//work", "two words", "a/b", "#work"]) {
    assert.equal(parseTagName(input), null);
  }
});

test("extracts multiple tags across lines, including Japanese and punctuation", () => {
  assert.deepEqual(extractTags("買い物 /暮らし\n資料 /仕事 /project-1 (/hoge), /huga /hoyo"),
    ["暮らし", "仕事", "project-1", "hoge", "huga", "hoyo"]);
  assert.deepEqual(extractTags("C/ mail@example.com/fragment / //invalid"), []);
  assert.deepEqual(extractTags("https://example.com/path /hoge #old"), ["hoge"]);
});

test("deduplicates case and Unicode variants while preserving the first spelling", () => {
  assert.deepEqual(extractTags("/Hoge /hoge /café /cafe\u0301"), ["Hoge", "café"]);
  assert.deepEqual(mergeTags(["Hoge", "仕事"], ["hoge", "暮らし"]), ["Hoge", "仕事", "暮らし"]);
});

test("suggests registered names by prefix, including / alone and Japanese", () => {
  const tags = ["hoge", "huga", "hoyo", "work", "仕事"];
  assert.deepEqual(suggestTags(tags, "h"), ["hoge", "huga", "hoyo"]);
  assert.deepEqual(suggestTags(tags, "HO"), ["hoge", "hoyo"]);
  assert.deepEqual(suggestTags(tags, "仕"), ["仕事"]);
  assert.deepEqual(suggestTags(tags, ""), tags);
  assert.deepEqual(suggestTags(tags, "unknown"), []);
});

test("finds only the tag under a collapsed cursor", () => {
  assert.deepEqual(getActiveTag("/", cursorAt(1)), { start: 0, end: 1, query: "" });
  const text = "資料 /仕事\n返信 /hoge あとで";
  const cursor = text.indexOf("/hoge") + 2;
  assert.deepEqual(getActiveTag(text, cursorAt(cursor)), {
    start: cursor - 2, end: cursor + 3, query: "h",
  });
  assert.equal(getActiveTag(text, { start: cursor, end: cursor + 1 }), null);
  assert.equal(getActiveTag("C/h", cursorAt(3)), null);
  assert.equal(getActiveTag("//h", cursorAt(3)), null);
  assert.equal(getActiveTag("/h ", cursorAt(3)), null);
  assert.equal(getActiveTag("#h", cursorAt(2)), null);
  assert.equal(getActiveTag("https://h", cursorAt(9)), null);
});

test("completes a tag and leaves the cursor ready for more text", () => {
  const text = "買い物 /h";
  const active = getActiveTag(text, cursorAt(text.length));
  const completed = completeTag(text, active, "hoge");
  assert.deepEqual(completed, { text: "買い物 /hoge ", cursor: 10 });
  assert.equal(getActiveTag(completed.text, cursorAt(completed.cursor)), null);
});

test("completion replaces the whole tag and preserves surrounding tasks and whitespace", () => {
  for (const suffix of [" あとで\n次のタスク /仕事", "\n次のタスク", ",あとで", "\tあとで"]) {
    const text = `前のタスク\n資料 /hoops${suffix}`;
    const start = text.indexOf("/hoops");
    const active = getActiveTag(text, cursorAt(start + 2));
    const completed = completeTag(text, active, "hoge");
    const space = /^[ \t]/u.test(suffix) ? "" : " ";
    assert.equal(completed.text, `前のタスク\n資料 /hoge${space}${suffix}`);
    assert.equal(getActiveTag(completed.text, cursorAt(completed.cursor)), null);
  }
});
