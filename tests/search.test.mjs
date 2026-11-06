import assert from "node:assert/strict";
import { test } from "node:test";
import { filterTasks } from "../utils/search.ts";

const tasks = [
  { id: "1", text: "資料まとめ /仕事", done: false },
  { id: "2", text: "Meeting /Work", done: true },
  { id: "3", text: "買い物 /暮らし", done: false },
  { id: "4", text: "資料 /仕事用", done: false },
];

test("searches task text by substring, including completed tasks and case variants", () => {
  assert.deepEqual(filterTasks(tasks, "まとめ"), [tasks[0]]);
  assert.deepEqual(filterTasks(tasks, "meet"), [tasks[1]]);
  assert.deepEqual(filterTasks(tasks, " WORK "), [tasks[1]]);
  assert.deepEqual(filterTasks(tasks, "unknown"), []);
});

test("tag selection uses the same substring search without exact tag matching", () => {
  assert.deepEqual(filterTasks(tasks, "/仕事"), [tasks[0], tasks[3]]);
  assert.deepEqual(filterTasks(tasks, "仕事"), [tasks[0], tasks[3]]);
  assert.deepEqual(filterTasks(tasks, "/"), tasks);
});

test("empty searches preserve ordering and task objects; Unicode forms match", () => {
  assert.deepEqual(filterTasks(tasks, "  "), tasks);
  assert.equal(filterTasks(tasks, "資料")[0], tasks[0]);
  const accented = [{ text: "cafe\u0301" }];
  assert.deepEqual(filterTasks(accented, "CAFÉ"), accented);
});
