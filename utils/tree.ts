import type { Task } from "../types/index";
import { extractTags, mergeTags } from "./tags.ts";

const tagKey = (tag: string) => tag.normalize("NFC").toLowerCase();

export function filterByTag(tasks: Task[], tag?: string | null): Task[] {
  if (!tag) return tasks;
  const key = tagKey(tag);
  return tasks.filter((task) => task.tags.some((name) => tagKey(name) === key));
}

export type Next = { kind: "sibling"; task: Task } | { kind: "up"; task: Task } | null;

const byOrder = (a: Task, b: Task) => a.order - b.order;
const childrenOf = (tasks: Task[], parentId: string | null) => tasks.filter(task => task.parentId === parentId);
const maxOrder = (tasks: Task[]) => tasks.length ? Math.max(...tasks.map(task => task.order)) : -1;

export function resolveFocus(tasks: Task[], tag?: string | null): { path: Task[]; now: Task | null; next: Next } {
  const roots = filterByTag(childrenOf(tasks, null).filter(task => !task.done).sort(byOrder), tag);
  const siblingsOf = (task: Task) => task.parentId === null ? roots : childrenOf(tasks, task.parentId).filter(task => !task.done).sort(byOrder);
  const following = (task: Task) => {
    const siblings = siblingsOf(task);
    return siblings[siblings.findIndex(sibling => sibling.id === task.id) + 1];
  };
  const path: Task[] = [];
  let current = roots[0];
  while (current) {
    path.push(current);
    current = childrenOf(tasks, current.id).filter(task => !task.done).sort(byOrder)[0];
  }
  const now = path.at(-1) ?? null;
  if (!now) return { path, now, next: null };
  const sibling = following(now);
  if (sibling) return { path, now, next: { kind: "sibling", task: sibling } };
  for (let index = path.length - 2; index >= 0; index--) {
    const destination = following(path[index]);
    if (destination) return { path, now, next: { kind: "up", task: destination } };
  }
  return { path, now, next: null };
}

function swapOrders(tasks: Task[], a: Task, b: Task): Task[] {
  return tasks.map(task => task.id === a.id ? { ...task, order: b.order } : task.id === b.id ? { ...task, order: a.order } : task);
}

export function swapFocusOrders(tasks: Task[], tag?: string | null): Task[] {
  const { now, next } = resolveFocus(tasks, tag);
  return now && next?.kind === "sibling" ? swapOrders(tasks, now, next.task) : tasks;
}

export function availableTags(tasks: Task[]): string[] {
  return mergeTags(...tasks.filter(task => task.parentId === null && !task.done).map(task => task.tags));
}

export function ancestorsOf(tasks: Task[], id: string): Task[] {
  const ancestors: Task[] = [];
  let current = tasks.find(task => task.id === id);
  while (current?.parentId) {
    current = tasks.find(task => task.id === current!.parentId);
    if (current) ancestors.unshift(current);
  }
  return ancestors;
}

function descendantIds(tasks: Task[], id: string): Set<string> {
  const ids = new Set<string>();
  const visit = (parentId: string) => {
    for (const child of childrenOf(tasks, parentId)) {
      ids.add(child.id);
      visit(child.id);
    }
  };
  visit(id);
  return ids;
}

export function countDescendants(tasks: Task[], id: string): number {
  return descendantIds(tasks, id).size;
}

export function deleteWithDescendants(tasks: Task[], id: string): Task[] {
  const removed = descendantIds(tasks, id);
  removed.add(id);
  return tasks.filter(task => !removed.has(task.id));
}

export function toggleWithCascade(tasks: Task[], id: string): Task[] {
  const target = tasks.find(task => task.id === id);
  if (!target) return tasks;
  const ancestors = ancestorsOf(tasks, id);
  if (target.done) {
    const reopened = new Set([id, ...ancestors.map(task => task.id)]);
    return tasks.map(task => reopened.has(task.id) && task.done ? { ...task, done: false } : task);
  }

  // Allocate completion orders separately for each sibling group. Already
  // completed descendants retain their order and object identity.
  const maxima = new Map<string | null, number>();
  for (const task of tasks) maxima.set(task.parentId, Math.max(maxima.get(task.parentId) ?? -Infinity, task.order));
  const changes = new Map<string, Task>();
  const complete = (task: Task) => {
    if (task.done) return;
    const order = (maxima.get(task.parentId) ?? -1) + 1;
    maxima.set(task.parentId, order);
    changes.set(task.id, { ...task, done: true, order });
  };
  const subtree = descendantIds(tasks, id);
  subtree.add(id);
  for (const task of tasks) if (subtree.has(task.id)) complete(task);
  for (const ancestor of [...ancestors].reverse()) {
    if (childrenOf(tasks, ancestor.id).some(task => !(changes.get(task.id) ?? task).done)) break;
    complete(ancestor);
  }
  return tasks.map(task => changes.get(task.id) ?? task);
}

export function buildChildTasks(existing: Task[], parentId: string | null, texts: string[], now: number): Task[] {
  const start = maxOrder(childrenOf(existing, parentId)) + 1;
  const ids = new Set(existing.map(task => task.id));
  let sequence = 0;
  return [...existing, ...texts.map((text, index): Task => {
    let id: string;
    do { id = `${now}-${sequence++}`; } while (ids.has(id));
    ids.add(id);
    return { id, parentId, text, tags: extractTags(text), done: false, createdAt: now, order: start + index };
  })];
}

export function moveSibling(tasks: Task[], id: string, direction: "up" | "down"): Task[] {
  const task = tasks.find(task => task.id === id);
  if (!task) return tasks;
  const siblings = childrenOf(tasks, task.parentId).filter(sibling => sibling.done === task.done).sort(byOrder);
  const index = siblings.findIndex(sibling => sibling.id === id);
  const adjacent = siblings[index + (direction === "up" ? -1 : 1)];
  return adjacent ? swapOrders(tasks, task, adjacent) : tasks;
}

export function flattenTree(tasks: Task[]): { task: Task; depth: number }[] {
  const result: { task: Task; depth: number }[] = [];
  const visit = (parentId: string | null, depth: number) => {
    const children = childrenOf(tasks, parentId).sort((a, b) => Number(a.done) - Number(b.done) || byOrder(a, b));
    for (const task of children) {
      result.push({ task, depth });
      visit(task.id, depth + 1);
    }
  };
  visit(null, 0);
  return result;
}

export function leafCount(tasks: Task[]): number {
  return tasks.filter(task => !task.done && !tasks.some(child => child.parentId === task.id && !child.done)).length;
}
