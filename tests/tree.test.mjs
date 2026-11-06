import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as tree from '../utils/tree.ts';
import { buildNewTasks } from '../utils/focus.ts';

const t = (id, parentId = null, order = 0, done = false, tags = []) => ({ id, parentId, order, done, tags, text: id, createdAt: 10 });
const ids = tasks => tasks.map(t => t.id);
const focus = tasks => tree.resolveFocus(tasks, null);
const invariant = tasks => {
  for (const task of tasks) {
    const children = tasks.filter(t => t.parentId === task.id);
    if (children.some(t => !t.done)) assert.equal(task.done, false, `I1 ${task.id}`);
    if (task.done) for (const child of children) assert.equal(child.done, true, `I2 ${task.id}`);
  }
};

test('S1: flat tasks keep NOW and sibling NEXT in order', () => {
  const a = t('a'), b = t('b', null, 1);
  assert.deepEqual(focus([b, a]), { path: [a], now: a, next: { kind: 'sibling', task: b } });
  assert.deepEqual(focus([]), { path: [], now: null, next: null });
});
test('S2: descends through parent, child and grandchild with full path', () => {
  const tasks = [t('root'), t('child', 'root'), t('grand', 'child')];
  assert.deepEqual(focus(tasks).path, tasks);
  assert.equal(focus(tasks).now, tasks[2]);
  assert.deepEqual(tree.ancestorsOf(tasks, 'grand'), tasks.slice(0, 2));
});
test('S3: skips completed children', () => {
  const tasks = [t('root'), t('done', 'root', 0, true), t('next', 'root', 1)];
  assert.equal(focus(tasks).now, tasks[2]);
});
test('S4: childless and reopened parents with all children done are leaves', () => {
  for (const tasks of [[t('root')], [t('root'), t('done', 'root', 0, true)]]) {
    assert.equal(focus(tasks).now, tasks[0]);
    assert.deepEqual(focus(tasks).path, [tasks[0]]);
  }
});
test('S5: NEXT is the next pending sibling', () => {
  const tasks = [t('r'), t('a', 'r'), t('d', 'r', 1, true), t('b', 'r', 2)];
  assert.deepEqual(focus(tasks).next, { kind: 'sibling', task: tasks[3] });
});
test('S6: NEXT goes up to the nearest ancestor sibling including filtered roots', () => {
  const tasks = [t('r', null, 0, false, ['Work']), t('a', 'r'), t('leaf', 'a'), t('b', 'r', 1), t('other', null, 1), t('tagged', null, 2, false, ['work'])];
  assert.deepEqual(focus(tasks).next, { kind: 'up', task: tasks[3] });
  const reduced = tasks.filter(t => t.id !== 'b');
  assert.deepEqual(tree.resolveFocus(reduced, 'WORK').next, { kind: 'up', task: tasks[5] });
});
test('S7: no destination gives null NEXT', () => {
  assert.equal(focus([t('r'), t('c', 'r')]).next, null);
});
test('S8: tag filtering applies only to roots and ignores child tags', () => {
  const tasks = [t('r', null, 0, false, ['Work']), t('c', 'r', 0, false, ['Child']), t('other', null, 1, false, ['Child'])];
  assert.equal(tree.resolveFocus(tasks, 'WORK').now, tasks[1]);
  assert.equal(tree.resolveFocus(tasks, 'Child').now, tasks[2]);
  assert.deepEqual(tree.resolveFocus(tasks, 'missing'), { path: [], now: null, next: null });
});
test('S9: available tags use pending roots in first occurrence order with normalization', () => {
  assert.deepEqual(tree.availableTags([t('a', null, 0, false, ['Work', 'cafe\u0301']), t('c', 'a', 0, false, ['child']), t('b', null, 1, false, ['work', 'café', '次']), t('d', null, 2, true, ['done'])]), ['Work', 'café', '次']);
});
test('S10: sibling swap changes only NOW and NEXT orders, preserving all completion states', () => {
  const tasks = [t('r'), t('a', 'r'), t('b', 'r', 3), t('d', 'r', 4, true)];
  const before = structuredClone(tasks);
  const result = tree.swapFocusOrders(tasks);
  assert.deepEqual(result, tasks.map(t => t.id === 'a' ? { ...t, order: 3 } : t.id === 'b' ? { ...t, order: 0 } : t));
  assert.equal(result[0], tasks[0]); assert.equal(result[3], tasks[3]);
  assert.deepEqual(tasks, before);
});
test('S11: up and absent NEXT return original reference', () => {
  for (const tasks of [[t('r'), t('c', 'r'), t('s', null, 1)], [t('r'), t('c', 'r')], []]) assert.equal(tree.swapFocusOrders(tasks), tasks);
});
test('S12: final child completion cascades upward and stops at pending siblings', () => {
  const tasks = [t('r'), t('a', 'r'), t('leaf', 'a'), t('d', 'a', 8, true)];
  const result = tree.toggleWithCascade(tasks, 'leaf');
  assert.ok(result.every(t => t.done));
  assert.deepEqual(result.map(t => t.order), [1, 1, 9, 8]);
  const stopped = tree.toggleWithCascade([...tasks, t('b', 'r', 3)], 'leaf');
  assert.equal(stopped[0].done, false); assert.equal(stopped[1].done, true); assert.equal(stopped[1].order, 4);
});
test('S13: reopening child reopens all ancestors, retains orders and descendants', () => {
  const tasks = [t('r', null, 9, true), t('c', 'r', 8, true), t('g', 'c', 7, true), t('s', 'c', 6, true)];
  assert.deepEqual(tree.toggleWithCascade(tasks, 'g'), tasks.map(t => t.id === 's' ? t : { ...t, done: false }));
  assert.deepEqual(tree.toggleWithCascade(tasks, 'c'), tasks.map(t => ['r', 'c'].includes(t.id) ? { ...t, done: false } : t));
});
test('S14: completing parent completes all descendants and appends per sibling group', () => {
  const tasks = [t('r'), t('a', 'r', 3), t('b', 'r', 7), t('g', 'a', 2), t('d', 'r', 9, true), t('other', null, 20)];
  const before = structuredClone(tasks);
  const result = tree.toggleWithCascade(tasks, 'r');
  assert.deepEqual(result.map(t => t.done), [true, true, true, true, true, false]);
  assert.deepEqual(result.map(t => t.order), [21, 10, 11, 3, 9, 20]);
  assert.equal(result[4], tasks[4]); assert.equal(result[5], tasks[5]); assert.deepEqual(tasks, before);
});
test('S15: child creation extracts tags, appends sibling orders and avoids ID collisions', () => {
  const tasks = [t('r', null, 100), t('123-0', 'r', 8), t('other', 'else', 999)];
  const result = tree.buildChildTasks(tasks, 'r', ['子 #Work #work', '次 #暮らし'], 123);
  assert.deepEqual(result.slice(3).map(({id, ...rest}) => rest), [
    { parentId: 'r', text: '子 #Work #work', tags: ['Work'], done: false, createdAt: 123, order: 9 },
    { parentId: 'r', text: '次 #暮らし', tags: ['暮らし'], done: false, createdAt: 123, order: 10 },
  ]);
  assert.equal(new Set(result.map(t => t.id)).size, result.length);
  assert.equal(result[0], tasks[0]);
  assert.equal(tree.buildChildTasks(tasks, 'new', ['x'], 123).at(-1).order, 0);
  const roots = buildNewTasks(tasks, ['new'], 123);
  assert.equal(roots.at(-1).parentId, null); assert.equal(roots.at(-1).order, 101);
});
test('S16: descendant count and deletion remove only the subtree', () => {
  const tasks = [t('r'), t('a', 'r'), t('g', 'a'), t('other', null, 1)];
  assert.equal(tree.countDescendants(tasks, 'r'), 2); assert.equal(tree.countDescendants(tasks, 'a'), 1);
  assert.equal(tree.countDescendants(tasks, 'g'), 0);
  assert.deepEqual(tree.deleteWithDescendants(tasks, 'a'), [tasks[0], tasks[3]]);
});
test('S17: moves only adjacent siblings with matching completion, edges preserve reference', () => {
  const tasks = [t('r'), t('a', 'r', 2), t('b', 'r', 5), t('done', 'r', 3, true), t('other', null, 4)];
  assert.deepEqual(tree.moveSibling(tasks, 'a', 'down'), tasks.map(t => t.id === 'a' ? { ...t, order: 5 } : t.id === 'b' ? { ...t, order: 2 } : t));
  assert.deepEqual(tree.moveSibling(tasks, 'b', 'up'), tree.moveSibling(tasks, 'a', 'down'));
  for (const [id, direction] of [['a','up'], ['b','down'], ['done','down'], ['other','down']]) assert.equal(tree.moveSibling(tasks, id, direction), tasks);
});
test('S18: flatten is preorder with depth and pending/done sorted within every group', () => {
  const tasks = [t('d', null, 0, true), t('r', null, 2), t('cd', 'r', 0, true), t('b', 'r', 2), t('a', 'r', 1), t('g', 'a')];
  assert.deepEqual(tree.flattenTree(tasks).map(({task, depth}) => [task.id, depth]), [['r',0], ['a',1], ['g',2], ['b',1], ['cd',1], ['d',0]]);
});
test('S19: I1 and I2 survive multiple operation sequences without mutation', () => {
  for (const operations of [['a','b','a','r'], ['r','a','b','r'], ['a','a','b','b']]) {
    let tasks = [t('r'), t('other', null, 1)];
    tasks = tree.buildChildTasks(tasks, 'r', ['a','b'], 123);
    tasks = tasks.map(t => ({ ...t, id: t.text }));
    invariant(tasks);
    for (const id of operations) {
      const before = structuredClone(tasks);
      const result = tree.toggleWithCascade(tasks, id);
      assert.deepEqual(tasks, before); tasks = result; invariant(tasks);
      tasks = tree.moveSibling(tasks, id, 'down'); invariant(tasks);
      tasks = tree.swapFocusOrders(tasks); invariant(tasks);
    }
    tasks = tree.deleteWithDescendants(tasks, 'a'); invariant(tasks);
    tasks = tasks.filter(t => !t.done); invariant(tasks);
  }
});
test('S20: existing T1–T18 and B1–B9 suites are included unchanged in the test run', async () => {
  await import('./tags.test.mjs'); await import('./tagInput.test.mjs');
  await import('./focus.test.mjs'); await import('./search.test.mjs');
});
test('S21: leafCount counts pending leaves including reopened parents', () => {
  assert.equal(tree.leafCount([]), 0);
  const tasks = [t('r'), t('a', 'r'), t('b', 'r', 1), t('g', 'a'), t('done', null, 2, true)];
  assert.equal(tree.leafCount(tasks), 2);
  assert.equal(tree.leafCount([t('r'), t('done', 'r', 0, true)]), 1);
});
