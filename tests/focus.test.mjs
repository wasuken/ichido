import assert from "node:assert/strict";
import { test } from "node:test";
import { availableTags, buildNewTasks, filterByTag, pickFocus, swapFocusOrders } from "../utils/focus.ts";

const task = (id, order, tags = [], done = false) => ({ id, text: `本文 ${id}`, order, tags, done, createdAt: 10 });
const tasks = [task("a", 0, ["仕事用"]), task("b", 1, ["仕事", "Work", "cafe\u0301"]), task("c", 2, ["仕事", "work", "café"]), task("d", 3, ["完了のみ"], true)];

test("T10: filterByTag matches complete normalized case-insensitive names", () => {
  assert.deepEqual(filterByTag(tasks, "仕事"), [tasks[1], tasks[2]]);
  assert.deepEqual(filterByTag(tasks, "WORK"), [tasks[1], tasks[2]]);
  assert.deepEqual(filterByTag(tasks, "CAFÉ"), [tasks[1], tasks[2]]);
  assert.deepEqual(filterByTag(tasks, "なし"), []);
  assert.deepEqual(filterByTag([task("x", 0, ["仕事用"])], "仕事"), []);
});

test("T11: filterByTag preserves order and objects; null or empty selects all", () => {
  const reversed = [...tasks].reverse();
  for (const tag of [null, ""]) assert.deepEqual(filterByTag(reversed, tag), reversed);
  const result = filterByTag(reversed, "仕事");
  assert.equal(result[0], tasks[2]);
  assert.equal(result[1], tasks[1]);
  assert.equal(filterByTag(tasks, null)[0], tasks[0]);
});

test("T12: availableTags lists only pending tags in first occurrence order", () => {
  assert.deepEqual(availableTags(tasks), ["仕事用", "仕事", "Work", "café"]);
  assert.deepEqual(availableTags([]), []);
});

test("T13: pickFocus selects the first two after filtering, including one and zero", () => {
  assert.deepEqual(pickFocus(tasks.slice(0, 3), null), { now: tasks[0], next: tasks[1] });
  assert.deepEqual(pickFocus(tasks.slice(0, 3), "仕事"), { now: tasks[1], next: tasks[2] });
  assert.deepEqual(pickFocus(tasks, "仕事用"), { now: tasks[0], next: null });
  assert.deepEqual(pickFocus(tasks, "なし"), { now: null, next: null });
  assert.deepEqual(pickFocus([], null), { now: null, next: null });
});

test("T14: swapFocusOrders swaps only the first two matching pending orders", () => {
  const input = [task("done", -1, ["仕事"], true), tasks[2], tasks[0], tasks[1], task("later", 8, ["仕事"])];
  const before = structuredClone(input);
  const result = swapFocusOrders(input, "仕事");
  assert.notEqual(result, input);
  assert.deepEqual(result, input.map(t => t.id === "b" ? { ...t, order: 2 } : t.id === "c" ? { ...t, order: 1 } : t));
  for (const index of [0, 2, 4]) assert.equal(result[index], input[index]);
  assert.deepEqual(input, before);
});

test("T15: fewer than two matching pending tasks returns the original array", () => {
  for (const tag of ["仕事用", "なし", "完了のみ"]) assert.equal(swapFocusOrders(tasks, tag), tasks);
  assert.equal(swapFocusOrders([], null).length, 0);
});

test("T16: no tag reproduces the original pending order swap", () => {
  const input = [tasks[2], tasks[3], tasks[0], tasks[1]];
  const expected = input.map(t => t.id === "a" ? { ...t, order: 1 } : t.id === "b" ? { ...t, order: 0 } : t);
  assert.deepEqual(swapFocusOrders(input), expected);
  assert.deepEqual(swapFocusOrders(input, null), expected);
});

test("T17: buildNewTasks appends extracted tags with orders after the maximum", () => {
  const existing = [task("a", 9), task("b", 20, [], true)];
  const before = structuredClone(existing);
  const texts = ["資料 #仕事 #Work #work", "買い物 #暮らし", "タグなし"];
  const result = buildNewTasks(existing, texts, 123);
  assert.deepEqual(result.slice(0, 2), existing);
  assert.equal(result[0], existing[0]);
  assert.deepEqual(result.slice(2).map(({ id, ...rest }) => rest), texts.map((text, i) => ({ text, tags: [["仕事", "Work"], ["暮らし"], []][i], done: false, createdAt: 123, order: 21 + i })));
  assert.equal(new Set(result.map(t => t.id)).size, result.length);
  assert.deepEqual(existing, before);
  const first = buildNewTasks([], ["#仕事"], 123);
  assert.equal(first[0].order, 0);
  const second = buildNewTasks(first, ["#仕事"], 123);
  assert.notEqual(second[0].id, second[1].id);
  assert.deepEqual(buildNewTasks(existing, [], 123), existing);
});
