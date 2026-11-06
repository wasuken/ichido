import type { Task } from "../types/index";
import { extractTags, mergeTags } from "./tags.ts";

const tagKey = (tag: string) => tag.normalize("NFC").toLowerCase();

export function filterByTag(tasks: Task[], tag?: string | null): Task[] {
  if (!tag) return tasks;
  const key = tagKey(tag);
  return tasks.filter((task) => task.tags.some((name) => tagKey(name) === key));
}

export function availableTags(pending: Task[]): string[] {
  return mergeTags(...pending.filter((task) => !task.done).map((task) => task.tags));
}

// pending is already in display order; filtering preserves that order.
export function pickFocus(pending: Task[], tag?: string | null): { now: Task | null; next: Task | null } {
  const filtered = filterByTag(pending, tag);
  return { now: filtered[0] ?? null, next: filtered[1] ?? null };
}

export function swapFocusOrders(tasks: Task[], tag?: string | null): Task[] {
  const pending = tasks.filter((task) => !task.done).sort((a, b) => a.order - b.order);
  const { now, next } = pickFocus(pending, tag);
  if (!now || !next) return tasks;
  return tasks.map((task) => {
    if (task === now) return { ...task, order: next.order };
    if (task === next) return { ...task, order: now.order };
    return task;
  });
}

// Return existing tasks followed by new tasks. IDs depend only on the inputs.
export function buildNewTasks(existing: Task[], texts: string[], now: number): Task[] {
  const maxOrder = existing.length ? Math.max(...existing.map((task) => task.order)) : -1;
  const ids = new Set(existing.map((task) => task.id));
  let sequence = 0;
  return [...existing, ...texts.map((text, index) => {
    let id: string;
    do { id = `${now}-${sequence++}`; } while (ids.has(id));
    ids.add(id);
    return { id, text, tags: extractTags(text), done: false, createdAt: now, order: maxOrder + index + 1 };
  })];
}
